import { useNotificationsCenter } from '../layout/components/NotificationsProvider';

export function useNotifications() {
  try {
    return useNotificationsCenter().notifications;
  } catch {
    return [];
  }
}
