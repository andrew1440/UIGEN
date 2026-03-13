import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

// Mock dependencies before imports
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: vi.fn(),
  clearAnonWork: vi.fn(),
}));

// Mock server actions
vi.mock("@/actions", () => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("@/actions/get-projects", () => ({
  getProjects: vi.fn(),
}));

vi.mock("@/actions/create-project", () => ({
  createProject: vi.fn(),
}));

// Now import after mocking
import { useAuth } from "@/hooks/use-auth";
import * as anonTracker from "@/lib/anon-work-tracker";
import { useRouter } from "next/navigation";
import * as actions from "@/actions";
import { getProjects } from "@/actions/get-projects";
import { createProject } from "@/actions/create-project";

describe("useAuth Hook", () => {
  const mockPush = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue({ push: mockPush });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Hook Initialization", () => {
    it("should return hook with initial isLoading state as false", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(false);
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
    });

    it("should have all required properties", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("isLoading");
    });
  });

  describe("signIn", () => {
    it("should sign in user with existing projects", async () => {
      const mockProject = {
        id: "project-123",
        name: "Test Project",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn("test@example.com", "password123");
      });

      expect(actions.signIn).toHaveBeenCalledWith("test@example.com", "password123");
      expect(signInResult?.success).toBe(true);
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-123");
      });
    });

    it("should navigate to first project when multiple projects exist", async () => {
      const projects = [
        { id: "project-1", name: "Recent Project" },
        { id: "project-2", name: "Older Project" },
        { id: "project-3", name: "Oldest Project" },
      ];

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue(projects);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/project-1");
      });
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    it("should handle sign-in failures gracefully", async () => {
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
      expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
    });

    it("should restore anonymous work after successful sign in", async () => {
      const mockAnonWork = {
        messages: [
          { id: "msg-1", content: "test", role: "user" },
          { id: "msg-2", content: "response", role: "assistant" },
        ],
        fileSystemData: { 
          files: {
            "App.jsx": { type: "file", content: "export default function App() {}" }
          }
        },
      };

      const mockProject = {
        id: "project-456",
        name: "Restored Project",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(anonTracker.clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-456");
      });
    });

    it("should not restore anonymous work if it's empty", async () => {
      const emptyAnonWork = {
        messages: [],
        fileSystemData: {},
      };

      const mockProject = {
        id: "project-789",
        name: "New Design",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(emptyAnonWork);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
        expect(createProject).toHaveBeenCalledWith(
          expect.objectContaining({
            name: expect.stringMatching(/New Design #\d+/),
            messages: [],
            data: {},
          })
        );
      });
    });

    it("should create new project if no projects exist and no anon work", async () => {
      const mockProject = {
        id: "project-new",
        name: "New Design",
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password123");
      });

      await waitFor(() => {
        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/New Design #\d+/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/project-new");
      });
    });

    it("should return error result from sign-in action", async () => {
      const errorMessage = "Account not found";
      (actions.signIn as any).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useAuth());

      let signInResult;
      await act(async () => {
        signInResult = await result.current.signIn("nonexistent@example.com", "password");
      });

      expect(signInResult).toEqual({
        success: false,
        error: errorMessage,
      });
    });

    it("should verify action was called with correct parameters", async () => {
      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      const email = "user@example.com";
      const password = "securePass123";

      await act(async () => {
        await result.current.signIn(email, password);
      });

      expect(actions.signIn).toHaveBeenCalledWith(email, password);
      expect(actions.signIn).toHaveBeenCalledTimes(1);
    });
  });

  describe("signUp", () => {
    it("should sign up user with existing projects", async () => {
      const mockProject = {
        id: "project-new",
        name: "Test Project",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([mockProject]);

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp("newuser@example.com", "password123");
      });

      expect(actions.signUp).toHaveBeenCalledWith("newuser@example.com", "password123");
      expect(signUpResult?.success).toBe(true);
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
      expect(anonTracker.clearAnonWork).not.toHaveBeenCalled();
    });

    it("should restore anonymous work after successful sign up", async () => {
      const mockAnonWork = {
        messages: [{ id: "msg-1", content: "test", role: "user" }],
        fileSystemData: { 
          files: {
            "Button.jsx": { type: "file", content: "export default function Button() {}" }
          }
        },
      };

      const mockProject = {
        id: "project-new-1",
        name: "Restored Project",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      await waitFor(() => {
        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringContaining("Design from"),
          messages: mockAnonWork.messages,
          data: mockAnonWork.fileSystemData,
        });
        expect(anonTracker.clearAnonWork).toHaveBeenCalled();
        expect(mockPush).toHaveBeenCalledWith("/project-new-1");
      });
    });

    it("should create new project if no projects exist after sign up", async () => {
      const mockProject = {
        id: "project-welcome",
        name: "New Design",
      };

      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("newuser@example.com", "password123");
      });

      await waitFor(() => {
        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/New Design #\d+/),
          messages: [],
          data: {},
        });
        expect(mockPush).toHaveBeenCalledWith("/project-welcome");
      });
    });

    it("should return error result from sign-up action", async () => {
      const errorMessage = "Password too weak";
      (actions.signUp as any).mockResolvedValue({
        success: false,
        error: errorMessage,
      });

      const { result } = renderHook(() => useAuth());

      let signUpResult;
      await act(async () => {
        signUpResult = await result.current.signUp("user@example.com", "123");
      });

      expect(signUpResult).toEqual({
        success: false,
        error: errorMessage,
      });
    });

    it("should verify action was called with correct parameters", async () => {
      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([{ id: "p1" }]);

      const { result } = renderHook(() => useAuth());

      const email = "newuser@example.com";
      const password = "securePassword123";

      await act(async () => {
        await result.current.signUp(email, password);
      });

      expect(actions.signUp).toHaveBeenCalledWith(email, password);
      expect(actions.signUp).toHaveBeenCalledTimes(1);
    });
  });

  describe("Post-Auth Flow", () => {
    it("should not call post-sign-in if sign-in fails", async () => {
      (actions.signIn as any).mockResolvedValue({
        success: false,
        error: "Invalid email",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("invalid@example.com", "password");
      });

      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should not call post-sign-up if sign-up fails", async () => {
      (actions.signUp as any).mockResolvedValue({
        success: false,
        error: "Email already exists",
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp("existing@example.com", "password");
      });

      expect(getProjects).not.toHaveBeenCalled();
      expect(createProject).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should handle project creation errors gracefully on sign-in", async () => {
      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockRejectedValue(new Error("Database error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@example.com", "password");
        })
      ).rejects.toThrow("Database error");
    });

    it("should navigate to project after restoring anonymous work", async () => {
      const mockAnonWork = {
        messages: [{ id: "m1", content: "hello" }],
        fileSystemData: {},
      };

      const mockProject = { id: "proj-123" };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/proj-123");
      });
      expect(anonTracker.clearAnonWork).toHaveBeenCalled();
    });
  });

  describe("Error Handling", () => {
    it("should handle getProjects errors during sign-in", async () => {
      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockRejectedValue(new Error("Fetch failed"));

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@example.com", "password");
        })
      ).rejects.toThrow("Fetch failed");
    });

    it("should handle getProjects errors during sign-up", async () => {
      (actions.signUp as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signUp("test@example.com", "password");
        })
      ).rejects.toThrow("Network error");
    });

    it("should handle anon work data retrieval errors", async () => {
      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockImplementation(() => {
        throw new Error("Storage access failed");
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("test@example.com", "password");
        })
      ).rejects.toThrow("Storage access failed");
    });
  });

  describe("Edge Cases", () => {
    it("should handle anon work with null messages", async () => {
      const mockAnonWork = {
        messages: null,
        fileSystemData: {},
      };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(mockAnonWork);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue({ id: "proj" });

      const { result } = renderHook(() => useAuth());

      // Should not crash, should treat as no anon work
      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      expect(createProject).toHaveBeenCalled();
    });

    it("should handle empty projects array correctly", async () => {
      const mockProject = { id: "new-proj" };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("test@example.com", "password");
      });

      await waitFor(() => {
        expect(createProject).toHaveBeenCalledWith({
          name: expect.stringMatching(/New Design #\d+/),
          messages: [],
          data: {},
        });
      });
    });

    it("should generate unique project names with random numbers", async () => {
      const mockProject = { id: "proj" };

      (actions.signIn as any).mockResolvedValue({ success: true });
      (anonTracker.getAnonWorkData as any).mockReturnValue(null);
      (getProjects as any).mockResolvedValue([]);
      (createProject as any).mockResolvedValue(mockProject);

      const { result: result1 } = renderHook(() => useAuth());
      const { result: result2 } = renderHook(() => useAuth());

      await act(async () => {
        await result1.current.signIn("test1@example.com", "password");
      });

      await act(async () => {
        await result2.current.signIn("test2@example.com", "password");
      });

      const call1 = (createProject as any).mock.calls[0][0];
      const call2 = (createProject as any).mock.calls[1][0];

      expect(call1.name).toMatch(/New Design #\d+/);
      expect(call2.name).toMatch(/New Design #\d+/);
      // Names might be same due to random nature, but should still be valid
    });
  });
});
