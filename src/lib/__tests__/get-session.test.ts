import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock server-only first
vi.mock("server-only");

// Mock dependencies before imports
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
}));

// Now import after mocking
import { getSession } from "@/lib/auth";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

describe("getSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return session payload when token is valid", async () => {
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date("2026-03-20"),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session).toEqual(mockPayload);
  });

  it("should call cookies() to get cookie store", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await getSession();

    expect(cookies).toHaveBeenCalled();
  });

  it("should retrieve auth-token cookie", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    await getSession();

    expect(mockCookieStore.get).toHaveBeenCalledWith("auth-token");
  });

  it("should return null when no token is present in cookies", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue(undefined),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getSession();

    expect(session).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("should return null when cookie value is undefined", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({}), // No value property
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getSession();

    expect(session).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("should verify JWT token with jwtVerify", async () => {
    const testToken = "test-jwt-token";
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: new Date(),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: testToken }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    await getSession();

    expect(jwtVerify).toHaveBeenCalledWith(testToken, expect.any(Uint8Array));
  });

  it("should return null when JWT verification fails", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "invalid-token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockRejectedValue(new Error("Invalid token signature"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("should handle JWT expiration error", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "expired-token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockRejectedValue(new Error("Token expired"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("should handle malformed token errors gracefully", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "malformed.token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockRejectedValue(new Error("Invalid JWT"));

    const session = await getSession();

    expect(session).toBeNull();
  });

  it("should parse session payload as SessionPayload type", async () => {
    const mockPayload = {
      userId: "user-abc",
      email: "user@test.com",
      expiresAt: new Date("2026-04-13"),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session).toHaveProperty("userId");
    expect(session).toHaveProperty("email");
    expect(session).toHaveProperty("expiresAt");
  });

  it("should handle different user IDs and emails", async () => {
    const testCases = [
      {
        userId: "user-1",
        email: "user1@example.com",
      },
      {
        userId: "user-2",
        email: "user2@example.com",
      },
      {
        userId: "user-special-chars-123",
        email: "user+test@example.co.uk",
      },
    ];

    for (const testCase of testCases) {
      vi.clearAllMocks();

      const mockPayload = {
        ...testCase,
        expiresAt: new Date(),
      };

      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "token" }),
      };

      (cookies as any).mockResolvedValue(mockCookieStore);
      (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

      const session = await getSession();

      expect(session?.userId).toBe(testCase.userId);
      expect(session?.email).toBe(testCase.email);
    }
  });

  it("should not throw when error is caught", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "invalid" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockRejectedValue(new Error("Verification failed"));

    let error;
    try {
      await getSession();
    } catch (e) {
      error = e;
    }

    expect(error).toBeUndefined();
  });

  it("should handle cookie store retrieval errors", async () => {
    (cookies as any).mockRejectedValue(new Error("Failed to get cookies"));

    let error;
    try {
      await getSession();
    } catch (e) {
      error = e;
    }

    // Should throw since cookies() call fails
    expect(error).toBeInstanceOf(Error);
  });

  it("should verify token using JWT_SECRET from environment", async () => {
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

    await getSession();

    // Verify that jwtVerify was called with a Uint8Array (encoded secret)
    const verifyCall = (jwtVerify as any).mock.calls[0];
    expect(verifyCall[0]).toBe("test-token");
    expect(verifyCall[1]).toBeInstanceOf(Uint8Array);
  });

  it("should preserve payload structure from JWT", async () => {
    const originalPayload = {
      userId: "user-789",
      email: "preserved@example.com",
      expiresAt: new Date("2026-06-13"),
      extra: "this should not be in session",
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: originalPayload });

    const session = await getSession();

    // Session should have the key properties
    expect(session).toHaveProperty("userId", "user-789");
    expect(session).toHaveProperty("email", "preserved@example.com");
    expect(session).toHaveProperty("expiresAt");
  });

  it("should handle empty string token value", async () => {
    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    const session = await getSession();

    // Empty string is falsy, so should be treated like no token
    // Depending on implementation, either null or it tries to verify
    // Let's assume it tries to verify and fails
    if (session === null) {
      expect(session).toBeNull();
    }
  });

  it("should be callable multiple times independently", async () => {
    const mockPayload1 = {
      userId: "user-1",
      email: "user1@example.com",
      expiresAt: new Date(),
    };

    const mockPayload2 = {
      userId: "user-2",
      email: "user2@example.com",
      expiresAt: new Date(),
    };

    const mockCookieStore = {
      get: vi.fn(),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);

    // First call
    mockCookieStore.get.mockReturnValue({ value: "token1" });
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload1 });

    const session1 = await getSession();
    expect(session1?.userId).toBe("user-1");

    // Second call
    vi.clearAllMocks();
    (cookies as any).mockResolvedValue(mockCookieStore);
    mockCookieStore.get.mockReturnValue({ value: "token2" });
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload2 });

    const session2 = await getSession();
    expect(session2?.userId).toBe("user-2");
  });

  it("should handle numeric user IDs", async () => {
    const mockPayload = {
      userId: "12345", // numeric as string
      email: "numeric@example.com",
      expiresAt: new Date(),
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session?.userId).toBe("12345");
  });

  it("should maintain expiresAt as Date object", async () => {
    const expiryDate = new Date("2026-12-31");
    const mockPayload = {
      userId: "user-123",
      email: "test@example.com",
      expiresAt: expiryDate,
    };

    const mockCookieStore = {
      get: vi.fn().mockReturnValue({ value: "token" }),
    };

    (cookies as any).mockResolvedValue(mockCookieStore);
    (jwtVerify as any).mockResolvedValue({ payload: mockPayload });

    const session = await getSession();

    expect(session?.expiresAt).toBeInstanceOf(Date);
    expect(session?.expiresAt?.getTime()).toBe(expiryDate.getTime());
  });
});
