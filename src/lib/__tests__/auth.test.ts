import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Mock server-only first to prevent errors
vi.mock("server-only");

// Mock dependencies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(),
  jwtVerify: vi.fn(),
}));

// Now import after mocking
import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

describe("Auth Library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  describe("createSession", () => {
    it("should create a session with valid JWT", async () => {
      const mockCookieStore = {
        set: vi.fn(),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);

      const mockSignJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue("test-token"),
      };

      (SignJWT as any).mockImplementation(() => mockSignJWT);

      await createSession("user-123", "test@example.com");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "test-token",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
          path: "/",
        })
      );
    });

    it("should set secure cookie in production", async () => {
      process.env.NODE_ENV = "production";

      const mockCookieStore = {
        set: vi.fn(),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);

      const mockSignJWT = {
        setProtectedHeader: vi.fn().mockReturnThis(),
        setExpirationTime: vi.fn().mockReturnThis(),
        setIssuedAt: vi.fn().mockReturnThis(),
        sign: vi.fn().mockResolvedValue("test-token"),
      };

      (SignJWT as any).mockImplementation(() => mockSignJWT);

      await createSession("user-123", "test@example.com");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "auth-token",
        "test-token",
        expect.objectContaining({
          secure: true,
        })
      );
    });
  });

  describe("getSession", () => {
    it("should return session payload when token is valid", async () => {
      const mockPayload = {
        userId: "user-123",
        email: "test@example.com",
        expiresAt: new Date(),
      };

      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);
      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const session = await getSession();

      expect(session).toEqual(mockPayload);
    });

    it("should return null when no token is present", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);

      const session = await getSession();

      expect(session).toBeNull();
    });

    it("should return null when token verification fails", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "invalid-token" }),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);
      (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

      const session = await getSession();

      expect(session).toBeNull();
    });
  });

  describe("deleteSession", () => {
    it("should delete the auth token cookie", async () => {
      const mockCookieStore = {
        delete: vi.fn(),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);

      await deleteSession();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("auth-token");
    });
  });

  describe("verifySession", () => {
    it("should verify session from request cookies", async () => {
      const mockPayload = {
        userId: "user-123",
        email: "test@example.com",
        expiresAt: new Date(),
      };

      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: "test-token" }),
        },
      } as any as NextRequest;

      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const session = await verifySession(mockRequest);

      expect(session).toEqual(mockPayload);
    });

    it("should return null when no token in request", async () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue(undefined),
        },
      } as any as NextRequest;

      const session = await verifySession(mockRequest);

      expect(session).toBeNull();
    });

    it("should return null when token verification fails", async () => {
      const mockRequest = {
        cookies: {
          get: vi.fn().mockReturnValue({ value: "invalid-token" }),
        },
      } as any as NextRequest;

      (jwtVerify as any).mockRejectedValue(new Error("Invalid token"));

      const session = await verifySession(mockRequest);

      expect(session).toBeNull();
    });
  });
});
