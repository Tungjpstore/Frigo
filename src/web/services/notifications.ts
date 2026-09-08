// Notifications domain service. The server derives notifications from real
// household state (expiring items, pending shopping). Offline returns an empty
// list — never fabricated alerts.
import { fetchJson, isOffline } from './http';

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
    try {
      const res = await fetchJson<{ notifications: AppNotification[] }>('/notifications');
      return Array.isArray(res.notifications) ? res.notifications : [];
    } catch (err) {
      if (!isOffline(err)) throw err;
      return [];
    }
  },
};
