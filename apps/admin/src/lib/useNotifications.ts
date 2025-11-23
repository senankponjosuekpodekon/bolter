import { useEffect, useState } from 'react';
import { websocketService } from '../services/websocketService';
import { useAuthStore } from '../stores/authStore';
import { NotificationPayload } from '../types/notification';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id);
      websocketService.onNotification((payload) => {
        queueMicrotask(() => setNotifications((prev) => [payload, ...prev]));
      });
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  return notifications;
}
