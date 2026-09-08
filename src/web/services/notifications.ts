import { fetchJson, guardPrivateSession, isOffline } from './http';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const assertCurrent = guardPrivateSession();
    try {
      const res = await fetchJson<{ notifications: AppNotification[] }>('/notifications');
      assertCurrent();
      return Array.isArray(res.notifications) ? res.notifications : [];
    } catch (err) {
      assertCurrent();
      if (!isOffline(err)) throw err;
      return [];
    }
  },
};
