import { useEffect, useState, useCallback, useRef, useContext } from 'react';
import { io, Socket } from 'socket.io-client';

export interface Notification {
  id: string;
  type: 'transaction' | 'kyc' | 'loan' | 'system' | 'report';
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
  userId: string;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reconnect: () => void;
}

/**
 * Hook for managing real-time notifications via WebSocket
 * Handles connection, event listening, and notification state
 */
export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);

  /**
   * Initialize WebSocket connection
   */
  const initializeSocket = useCallback(() => {
    if (socketRef.current?.connected) {
      return;
    }

    const token = localStorage.getItem('authToken');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    socketRef.current = io(apiUrl, {
      auth: {
        token,
      },
      reconnection: true,
      reconnectionDelay: reconnectDelayRef.current,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    // Connection handlers
    socketRef.current.on('connect', () => {
      console.log('[WebSocket] Connected');
      setIsConnected(true);
      reconnectAttemptsRef.current = 0;
      reconnectDelayRef.current = 1000;
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setIsConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      reconnectAttemptsRef.current++;
    });

    // Notification handlers
    socketRef.current.on('notification:new', (notification: Notification) => {
      console.log('[WebSocket] New notification:', notification.type);
      setNotifications((prev) => [notification, ...prev]);
    });

    socketRef.current.on('notification:read', (data: { notificationId: string }) => {
      console.log('[WebSocket] Notification marked as read');
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === data.notificationId ? { ...n, read: true } : n
        )
      );
    });

    socketRef.current.on('notification:deleted', (data: { notificationId: string }) => {
      console.log('[WebSocket] Notification deleted');
      setNotifications((prev) => prev.filter((n) => n.id !== data.notificationId));
    });

    socketRef.current.on('notifications:batch', (data: { notifications: Notification[] }) => {
      console.log('[WebSocket] Batch notifications received:', data.notifications.length);
      setNotifications(data.notifications);
    });

    // Transaction events
    socketRef.current.on('transaction:approved', (data: any) => {
      const notification: Notification = {
        id: `trans_${Date.now()}`,
        type: 'transaction',
        title: 'Transaction Approved',
        message: `Transaction ${data.transactionId} has been approved`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    socketRef.current.on('transaction:rejected', (data: any) => {
      const notification: Notification = {
        id: `trans_${Date.now()}`,
        type: 'transaction',
        title: 'Transaction Rejected',
        message: `Transaction ${data.transactionId} has been rejected`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    // KYC events
    socketRef.current.on('kyc:approved', (data: any) => {
      const notification: Notification = {
        id: `kyc_${Date.now()}`,
        type: 'kyc',
        title: 'KYC Approved',
        message: `KYC verification for ${data.userId} has been approved`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    socketRef.current.on('kyc:rejected', (data: any) => {
      const notification: Notification = {
        id: `kyc_${Date.now()}`,
        type: 'kyc',
        title: 'KYC Rejected',
        message: `KYC verification for ${data.userId} has been rejected`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    // Loan events
    socketRef.current.on('loan:approved', (data: any) => {
      const notification: Notification = {
        id: `loan_${Date.now()}`,
        type: 'loan',
        title: 'Loan Approved',
        message: `Loan application has been approved for ${data.amount} ${data.currency}`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    socketRef.current.on('loan:rejected', (data: any) => {
      const notification: Notification = {
        id: `loan_${Date.now()}`,
        type: 'loan',
        title: 'Loan Rejected',
        message: `Loan application has been rejected: ${data.reason}`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    // System events
    socketRef.current.on('system:alert', (data: any) => {
      const notification: Notification = {
        id: `sys_${Date.now()}`,
        type: 'system',
        title: 'System Alert',
        message: data.message,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });

    // Report events
    socketRef.current.on('report:ready', (data: any) => {
      const notification: Notification = {
        id: `rep_${Date.now()}`,
        type: 'report',
        title: 'Report Ready',
        message: `Your ${data.reportType} report is ready for download`,
        data,
        read: false,
        createdAt: new Date().toISOString(),
        userId: data.userId,
      };
      setNotifications((prev) => [notification, ...prev]);
    });
  }, []);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('notification:mark-read', { notificationId });
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  /**
   * Delete notification
   */
  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('notification:delete', { notificationId });
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, []);

  /**
   * Clear all notifications
   */
  const clearAll = useCallback(async () => {
    if (!socketRef.current?.connected) return;

    try {
      socketRef.current.emit('notification:clear-all');
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  /**
   * Manually reconnect
   */
  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.connect();
    }
  }, []);

  /**
   * Setup and cleanup
   */
  useEffect(() => {
    initializeSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeSocket]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    deleteNotification,
    clearAll,
    reconnect,
  };
};

/**
 * Context for sharing notifications across app
 * Usage: Wrap App with NotificationsProvider, use useNotificationsContext in components
 */
import { createContext } from 'react';

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  markAsRead: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const NotificationsContext = createContext<NotificationsContextType | null>(null);

export const useNotificationsContext = (): NotificationsContextType => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotificationsContext must be used within NotificationsProvider');
  }
  return context;
};
