import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { notificationsApi } from "../api";
import type { Notification } from "../types";
import { useAuth } from "./AuthContext";

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  deleteNotification: (id: number) => Promise<void>;
}

export const NotificationContext =
  createContext<NotificationContextType | null>(null);

const POLL_BASE_MS = 30_000;
const MAX_BACKOFF_MS = 300_000;

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const failCount = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const scheduleNext = useCallback((delayMs: number) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      poll();
    }, delayMs);
  }, []);

  const poll = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [data, count] = await Promise.all([
        notificationsApi.getNotifications(0, 30),
        notificationsApi.getUnreadCount(),
      ]);
      failCount.current = 0;
      setNotifications(data);
      setUnreadCount(count);
      scheduleNext(POLL_BASE_MS);
    } catch {
      failCount.current += 1;
      const backoff = Math.min(
        POLL_BASE_MS * Math.pow(2, failCount.current - 1),
        MAX_BACKOFF_MS,
      );
      scheduleNext(backoff);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, scheduleNext]);

  const fetchNotifications = useCallback(async () => {
    failCount.current = 0;
    clearTimeout(timerRef.current);
    await poll();
  }, [poll]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearTimeout(timerRef.current);
      setNotifications([]);
      setUnreadCount(0);
      failCount.current = 0;
      return;
    }
    poll();
    return () => clearTimeout(timerRef.current);
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: number) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationId === id ? { ...n, readStatus: true } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, readStatus: true })));
    setUnreadCount(0);
  }, []);

  const deleteNotification = useCallback(
    async (id: number) => {
      const target = notifications.find((n) => n.notificationId === id);
      await notificationsApi.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.notificationId !== id));
      if (target && !target.readStatus) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    },
    [notifications],
  );

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllRead,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
