import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authApi, tokenStore } from '../api';
import type { UserSummary, LoginRequest, RegisterRequest } from '../types';

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

const AuthContext = createContext<AuthContextType | null>(null);

const USER_STORAGE_KEY = 'cs_user_v1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(() => {
    try {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  // On mount, try to restore session using refresh token cookie
  useEffect(() => {
    const restore = async () => {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (!stored) {
        setIsLoading(false);
        return;
      }
      try {
        // Attempt silent refresh — cs_refresh_token cookie sent automatically
        const { accessToken } = await authApi.refresh();
        tokenStore.set(accessToken);
        // Re-fetch profile to get fresh data
        const parsed: UserSummary = JSON.parse(stored);
        const fresh = await authApi.getProfile(parsed.userId);
        const summary: UserSummary = {
          userId: fresh.userId,
          username: fresh.username,
          email: fresh.email,
          fullName: fresh.fullName,
          bio: fresh.bio,
          profilePicUrl: fresh.profilePicUrl,
          role: fresh.role,
          isActive: fresh.isActive,
        };
        setUser(summary);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(summary));
      } catch {
        // Refresh failed — session expired
        tokenStore.clear();
        setUser(null);
        localStorage.removeItem(USER_STORAGE_KEY);
      } finally {
        setIsLoading(false);
      }
    };
    restore();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data);
    tokenStore.set(res.accessToken);
    setUser(res.user);
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
        role: fresh.role,
        isActive: fresh.isActive,
      };
      setUser(summary);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(summary));
    } catch {
      // ignore
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, updateUser, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
