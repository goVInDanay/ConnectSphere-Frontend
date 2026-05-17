import { notificationClient } from '../client';
import type { Notification } from '../../types';

// The API gateway has NO explicit route for /api/notifications/**.
// The notification-service is reachable through Spring Cloud Gateway's Eureka
// discovery locator at:  /notification-service/api/notifications/**
//
// notificationClient has baseURL = '/notification-service/api' so the paths
// below are relative to that base (e.g. '/notifications' → correct full path).
// vite.config.ts proxies /notification-service/** → gateway on port 8080.

export const notificationsApi = {
  // GET /notification-service/api/notifications?page=&size=
  getNotifications: async (page = 0, size = 20): Promise<Notification[]> => {
    const res = await notificationClient.get<Notification[]>('/notifications', {
      params: { page, size },
    });
    return res.data;
  },

  // GET /notification-service/api/notifications/unread-count
  getUnreadCount: async (): Promise<number> => {
    const res = await notificationClient.get<{ unreadCount: number }>(
      '/notifications/unread-count'
    );
    return res.data.unreadCount;
  },

  // POST /notification-service/api/notifications/{id}/read
  markAsRead: async (notificationId: number): Promise<void> => {
    await notificationClient.post(`/notifications/${notificationId}/read`);
  },

  // PUT /notification-service/api/notifications/read-all
  markAllRead: async (): Promise<void> => {
    await notificationClient.put('/notifications/read-all');
  },

  // DELETE /notification-service/api/notifications/{id}
  deleteNotification: async (notificationId: number): Promise<void> => {
    await notificationClient.delete(`/notifications/${notificationId}`);
  },
};
