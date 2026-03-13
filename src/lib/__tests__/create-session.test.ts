import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only first
vi.mock("server-only");

// Mock dependencies before imports
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  SignJWT: vi.fn(),
}));

// Now import after mocking
import { createSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { SignJWT } from "jose";

describe("createSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "development";
  });

  it("should create a session token with correct JWT structure", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-jwt-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-123", "test@example.com");

    // Verify JWT was created with correct algorithm
    expect(mockSignJWT.setProtectedHeader).toHaveBeenCalledWith({
      alg: "HS256",
    });

    // Verify expiration was set to 7 days
    expect(mockSignJWT.setExpirationTime).toHaveBeenCalledWith("7d");

    // Verify issued at was set
    expect(mockSignJWT.setIssuedAt).toHaveBeenCalled();

    // Verify token was signed
    expect(mockSignJWT.sign).toHaveBeenCalled();
  });

  it("should set httpOnly cookie in development environment", async () => {
    process.env.NODE_ENV = "development";

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-jwt-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-123", "test@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "test-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        secure: false, // not secure in development
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("should set secure cookie in production environment", async () => {
    process.env.NODE_ENV = "production";

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-jwt-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-456", "prod@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledWith(
      "auth-token",
      "test-jwt-token",
      expect.objectContaining({
        httpOnly: true,
        secure: true, // secure in production
        sameSite: "lax",
        path: "/",
      })
    );
  });

  it("should set cookie expiration to 7 days", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-jwt-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    const beforeCall = Date.now();
    await createSession("user-789", "session@example.com");
    const afterCall = Date.now();

    const callArgs = mockCookieStore.set.mock.calls[0];
    const expiresAt = callArgs[2].expires as Date;

    // Should expire in approximately 7 days
    const expectedExpiry = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    const actualExpiry = expiresAt.getTime() - beforeCall;

    // Allow 5 second tolerance
    expect(Math.abs(actualExpiry - expectedExpiry)).toBeLessThan(5000);
  });

  it("should include user data in JWT payload", async () => {
    const userId = "user-123";
    const email = "test@example.com";

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-jwt-token"),
    };

    (SignJWT as any).mockImplementation((payload) => {
      // Verify the payload contains user data
      expect(payload).toEqual(
        expect.objectContaining({
          userId,
          email,
        })
      );
      return mockSignJWT;
    });

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession(userId, email);

    expect(SignJWT).toHaveBeenCalled();
  });

  it("should use auth-token as cookie name", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("secret-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-id", "user@example.com");

    const firstArg = mockCookieStore.set.mock.calls[0][0];
    expect(firstArg).toBe("auth-token");
  });

  it("should pass JWT token to cookie setter", async () => {
    const testToken = "signed-jwt-token-12345";

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue(testToken),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-id", "user@example.com");

    const secondArg = mockCookieStore.set.mock.calls[0][1];
    expect(secondArg).toBe(testToken);
  });

  it("should use lax sameSite policy", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-id", "user@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.sameSite).toBe("lax");
  });

  it("should set cookie path to root", async () => {
    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-id", "user@example.com");

    const cookieOptions = mockCookieStore.set.mock.calls[0][2];
    expect(cookieOptions.path).toBe("/");
  });

  it("should handle multiple createSession calls independently", async () => {
    const mockSignJWT1 = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("token-1"),
    };

    const mockSignJWT2 = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("token-2"),
    };

    let callCount = 0;
    (SignJWT as any).mockImplementation(() => {
      callCount++;
      return callCount === 1 ? mockSignJWT1 : mockSignJWT2;
    });

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-1", "user1@example.com");
    await createSession("user-2", "user2@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledTimes(2);
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(
      1,
      "auth-token",
      "token-1",
      expect.any(Object)
    );
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(
      2,
      "auth-token",
      "token-2",
      expect.any(Object)
    );
  });

  it("should maintain cookie security settings across multiple calls", async () => {
    process.env.NODE_ENV = "production";

    const mockSignJWT = {
      setProtectedHeader: vi.fn().mockReturnThis(),
      setExpirationTime: vi.fn().mockReturnThis(),
      setIssuedAt: vi.fn().mockReturnThis(),
      sign: vi.fn().mockResolvedValue("test-token"),
    };

    (SignJWT as any).mockImplementation(() => mockSignJWT);

    const mockCookieStore = {
      set: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await createSession("user-1", "user1@example.com");
    await createSession("user-2", "user2@example.com");

    // Both calls should have secure flag
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(
      1,
      "auth-token",
      expect.any(String),
      expect.objectContaining({
        secure: true,
        httpOnly: true,
      })
    );
    expect(mockCookieStore.set).toHaveBeenNthCalledWith(
      2,
      "auth-token",
      expect.any(String),
      expect.objectContaining({
        secure: true,
        httpOnly: true,
      })
    );
  });
});
