import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { signUp, signIn, signOut, getUser } from "@/actions";
import { prisma } from "@/lib/prisma";
import * as authLib from "@/lib/auth";
import bcrypt from "bcrypt";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// Mock dependencies
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth");
vi.mock("bcrypt");
vi.mock("next/cache");
vi.mock("next/navigation");

describe("Auth Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signUp", () => {
    it("should create a new user with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
      };

      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password");
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (authLib.createSession as any).mockResolvedValue(undefined);

      const result = await signUp("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          password: "hashed-password",
        },
      });
      expect(authLib.createSession).toHaveBeenCalledWith("user-123", "test@example.com");
    });

    it("should reject when email is already registered", async () => {
      const existingUser = {
        id: "user-456",
        email: "test@example.com",
      };

      (prisma.user.findUnique as any).mockResolvedValue(existingUser);

      const result = await signUp("test@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email already registered");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should reject when password is less than 8 characters", async () => {
      const result = await signUp("test@example.com", "short");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Password must be at least 8 characters");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should reject when email is missing", async () => {
      const result = await signUp("", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should reject when password is missing", async () => {
      const result = await signUp("test@example.com", "");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue("hashed-password");
      (prisma.user.create as any).mockRejectedValue(new Error("Database error"));

      const result = await signUp("test@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("An error occurred during sign up");
    });
  });

  describe("signIn", () => {
    it("should sign in user with valid credentials", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (authLib.createSession as any).mockResolvedValue(undefined);

      const result = await signIn("test@example.com", "password123");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(authLib.createSession).toHaveBeenCalledWith("user-123", "test@example.com");
      expect(revalidatePath).toHaveBeenCalledWith("/");
    });

    it("should reject when user is not found", async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const result = await signIn("nonexistent@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(authLib.createSession).not.toHaveBeenCalled();
    });

    it("should reject when password is incorrect", async () => {
      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        password: "hashed-password",
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const result = await signIn("test@example.com", "wrongpassword");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid credentials");
      expect(authLib.createSession).not.toHaveBeenCalled();
    });

    it("should reject when email is missing", async () => {
      const result = await signIn("", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should reject when password is missing", async () => {
      const result = await signIn("test@example.com", "");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Email and password are required");
    });

    it("should handle database errors gracefully", async () => {
      (prisma.user.findUnique as any).mockRejectedValue(new Error("Database error"));

      const result = await signIn("test@example.com", "password123");

      expect(result.success).toBe(false);
      expect(result.error).toBe("An error occurred during sign in");
    });
  });

  describe("signOut", () => {
    it("should delete session and redirect", async () => {
      (authLib.deleteSession as any).mockResolvedValue(undefined);

      await signOut();

      expect(authLib.deleteSession).toHaveBeenCalled();
      expect(revalidatePath).toHaveBeenCalledWith("/");
      expect(redirect).toHaveBeenCalledWith("/");
    });
  });

  describe("getUser", () => {
    it("should return user data when session exists", async () => {
      const mockSession = {
        userId: "user-123",
        email: "test@example.com",
        expiresAt: new Date(),
      };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        createdAt: new Date(),
      };

      (authLib.getSession as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const result = await getUser();

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-123" },
        select: {
          id: true,
          email: true,
          createdAt: true,
        },
      });
    });

    it("should return null when no session exists", async () => {
      (authLib.getSession as any).mockResolvedValue(null);

      const result = await getUser();

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return null when user lookup fails", async () => {
      const mockSession = {
        userId: "user-123",
        email: "test@example.com",
        expiresAt: new Date(),
      };

      (authLib.getSession as any).mockResolvedValue(mockSession);
      (prisma.user.findUnique as any).mockRejectedValue(new Error("Database error"));

      const result = await getUser();

      expect(result).toBeNull();
    });
  });
});
