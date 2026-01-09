import React, { ReactNode, useMemo } from 'react';
import { NotificationsContext, useNotifications } from '../hooks/useNotifications';

interface NotificationsProviderProps {
  children: ReactNode;
}

/**
 * Provider component for global notifications context
 * Wraps the entire app to provide WebSocket-based notifications
 *
 * Usage:
 * ```tsx
 * <NotificationsProvider>
 *   <App />
 * </NotificationsProvider>
 * ```
 *
 * Access notifications in components:
 * ```tsx
 * const { notifications, unreadCount, markAsRead } = useNotificationsContext();
 * ```
 */
export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({ children }) => {
  const {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    deleteNotification,
    clearAll,
  } = useNotifications();

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isConnected,
      markAsRead,
      deleteNotification,
      clearAll,
    }),
    [notifications, unreadCount, isConnected, markAsRead, deleteNotification, clearAll]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export default NotificationsProvider;
