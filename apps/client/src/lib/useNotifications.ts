import { useEffect, useState } from 'react';
import { websocketService } from '../services/websocketService';
import { useAuthStore } from '../stores/authStore';

export function useNotifications() {
  type Notification = {
    id: string;
    type: string;
    message: string;
    createdAt?: string;
    [key: string]: unknown;
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      websocketService.connect(user.id);
      websocketService.onNotification((payload) => {
        // defer updates to avoid sync setState while other components are rendering
        queueMicrotask(() => {
          setNotifications((prev) => [payload, ...prev]);
        });
      });
      return () => {
        websocketService.disconnect();
      };
    }
  }, [user?.id]);

  return notifications;
}
