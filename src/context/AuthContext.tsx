import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { authApi, tokenStore } from "../api";
import type { UserSummary, LoginRequest, RegisterRequest } from "../types";

interface AuthContextType {
  user: UserSummary | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (partial: Partial<UserSummary>) => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = "cs_user_v1";

function normalizeRole(role: string): string {
  if (!role) return role;
  return role.startsWith("ROLE_") ? role.slice(5) : role;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const hasUser = !!localStorage.getItem(USER_STORAGE_KEY);
      const hasToken = !!sessionStorage.getItem("cs_token_v1");
      return !(hasUser && hasToken);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }
      let cachedUser: UserSummary | null = null;
      try {
        cachedUser = JSON.parse(stored);
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
        setIsLoading(false);
        return;
      }

      try {
        const { accessToken } = await authApi.refresh();
        tokenStore.set(accessToken);
        const fresh = await authApi.getProfile(cachedUser!.userId);
        const summary: UserSummary = {
          userId: fresh.userId,
          username: fresh.username,
          email: fresh.email,
          fullName: fresh.fullName,
          bio: fresh.bio,
          profilePicUrl: fresh.profilePicUrl,
          role: normalizeRole(fresh.role),
          active: fresh.active,
        };
        setUser(summary);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(summary));
      } catch {
        setUser(cachedUser);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    tokenStore.set(res.accessToken);
    setUser({ ...res.user, role: normalizeRole(res.user.role) });
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      tokenStore.clear();
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }, []);

  const updateUser = useCallback((partial: Partial<UserSummary>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partial };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    try {
      const fresh = await authApi.getProfile(user.userId);
      const summary: UserSummary = {
        userId: fresh.userId,
        username: fresh.username,
        email: fresh.email,
        fullName: fresh.fullName,
        bio: fresh.bio,
        profilePicUrl: fresh.profilePicUrl,
        role: normalizeRole(fresh.role),
        active: fresh.active,
      };
      setUser(summary);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(summary));
    } catch {}
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
