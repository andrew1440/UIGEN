import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";
import * as actions from "@/actions";
import * as anonTracker from "@/lib/anon-work-tracker";
import { useRouter } from "next/navigation";

// Mock dependencies
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  getProjects: vi.fn(),
  createProject: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

describe("useAuth Hook", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  describe("signIn", () => {
    it("should sign in user and handle post-sign-in flow", async () => {
      const mockProject = {
        id: "project-123",
        name: "Test Project",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (actions.getProjects as any).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      expect(actions.signIn).toHaveBeenCalledWith("test@example.com", "password123");
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-123");
      });
    });

    it("should handle sign-in failures", async () => {
      (actions.signIn as any).mockResolvedValue({
        success: false,
        error: "Invalid credentials",
      });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "wrongpass");
      });

      expect(signInResult?.success).toBe(false);
      expect(signInResult?.error).toBe("Invalid credentials");
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should restore anonymous work after sign in", async () => {
      const mockAnonWork = {
        messages: [{ id: "msg-1", content: "test", role: "user" }],
        fileSystemData: { files: [] },
      };

      const mockProject = {
        id: "project-456",
        name: "Restored Project",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (actions.createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(actions.createProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(anonTracker.clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-456");
      });
    });

    it("should create new project if no projects exist", async () => {
      const mockProject = {
        id: "project-789",
        name: "New Design",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (actions.getProjects as any).mockResolvedValue([]);
      (actions.createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(actions.createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/New Design #\d+/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/project-789");
      });
    });

    it("should set loading state during sign in", async () => {
      (actions.signIn as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (actions.getProjects as any).mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const signInPromise = result.current.signIn("test@example.com", "password123");
        expect(result.current.isLoading).toBe(true);
        await signInPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("signUp", () => {
    it("should sign up user and handle post-sign-up flow", async () => {
      const mockProject = {
        id: "project-new",
        name: "Test Project",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (actions.getProjects as any).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      expect(actions.signUp).toHaveBeenCalledWith("newuser@example.com", "password123");
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-new");
      });
    });

    it("should handle sign-up failures", async () => {
      (actions.signUp as any).mockResolvedValue({
        success: false,
        error: "Email already registered",
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp("existing@example.com", "password123");
      });

      expect(signUpResult?.success).toBe(false);
      expect(signUpResult?.error).toBe("Email already registered");
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should restore anonymous work after sign up", async () => {
      const mockAnonWork = {
        messages: [{ id: "msg-1", content: "test", role: "user" }],
        fileSystemData: { files: [] },
      };

      const mockProject = {
        id: "project-456",
        name: "Restored Project",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (actions.createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      await waitFor(() => {
        expect(actions.createProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(anonTracker.clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-456");
      });
    });

    it("should set loading state during sign up", async () => {
      (actions.signUp as any).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (actions.getProjects as any).mockResolvedValue([]);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);

      await act(async () => {
        const signUpPromise = result.current.signUp("newuser@example.com", "password123");
        expect(result.current.isLoading).toBe(true);
        await signUpPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});
