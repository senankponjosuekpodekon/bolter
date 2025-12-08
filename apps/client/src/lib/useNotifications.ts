import { useEffect, useState } from 'react';
import { websocketService, NotificationPayload } from '../services/websocketService';

export function useNotifications() {
  type Notification = {
    id: string;
    type: string;
    message: string;
    createdAt?: string;
    [key: string]: unknown;
  };
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const unsubscribe = websocketService.onNotification((payload: NotificationPayload) => {
      // Convert NotificationPayload to Notification format
      const notification: Notification = {
        id: payload.id || `${Date.now()}-${Math.random()}`,
        type: payload.type || payload.event || 'info',
        message: payload.message || payload.title || '',
        createdAt: payload.createdAt,
        ...payload,
      };

      // defer updates to avoid sync setState while other components are rendering
      queueMicrotask(() => {
        setNotifications((prev) => [notification, ...prev]);
      });
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  return notifications;
}
