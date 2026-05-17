import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { authApi, tokenStore } from "../api";

export function TestComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <div>
      <span data-testid="auth">{isAuthenticated ? "yes" : "no"}</span>
      <span data-testid="user">{user ? user.username : "none"}</span>
      <button onClick={() => login({ email: "test", password: "123" })}>
        login
      </button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

jest.mock("../api", () => ({
  authApi: {
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    refresh: jest.fn(),
    getProfile: jest.fn(),
  },
  tokenStore: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
  },
}));

test("initial state unauthenticated", () => {
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
  expect(screen.getByTestId("auth").textContent).toBe("no");
});

test("login works", async () => {
  (authApi.login as jest.Mock).mockResolvedValue({
    accessToken: "abc123",
    user: {
      userId: 1,
      username: "govind",
      role: "ROLE_USER",
    },
  });

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText("login"));
  await waitFor(() => {
    expect(tokenStore.set).toHaveBeenCalledWith("abc123");
  });

  expect(screen.getByTestId("auth").textContent).toBe("yes");
  expect(screen.getByTestId("user").textContent).toBe("govind");
});

test("logout clears user", async () => {
  (authApi.logout as jest.Mock).mockReturnValue({});
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );
  fireEvent.click(screen.getByText("logout"));

  await waitFor(() => {
    expect(tokenStore.clear).toHaveBeenCalled();
  });

  expect(screen.getByTestId("auth").textContent).toBe("no");
});

test("restores user from localstorage", async () => {
  localStorage.setItem(
    "cs_user_v1",
    JSON.stringify({ userId: 1, username: "govind" }),
  );

  (authApi.refresh as jest.Mock).mockResolvedValue({
    accessToken: "new-token",
  });

  (authApi.getProfile as jest.Mock).mockResolvedValue({
    userId: 1,
    username: "govind",
    role: "ROLE_USER",
  });

  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>,
  );

  await waitFor(() => {
    expect(screen.getByTestId("user").textContent).toBe("govind");
  });
});
