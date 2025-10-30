import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

export type ClientNotification = {
  id: string;
  event: string;
  title?: string;
  message?: string;
  status?: string;
  receivedAt: string;
  read: boolean;
  [key: string]: unknown;
};

type NotificationsContextValue = {
  notifications: ClientNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clear: () => void;
};

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

const DEFAULT_NAMESPACE = "/notifications";
const MAX_ITEMS = 30;

const resolveBaseUrl = (): string => {
  const preferred =
    import.meta.env.VITE_NOTIFICATIONS_URL || import.meta.env.VITE_API_URL;
  const fallback = window.location.origin;
  if (!preferred) {
    return fallback;
  }

  try {
    const url = new URL(preferred, window.location.origin);
    const trimmedPath = url.pathname
      .replace(/\/?api\/?$/, "")
      .replace(/\/$/, "");
    return `${url.origin}${trimmedPath ? trimmedPath : ""}`;
  } catch (error) {
    console.warn(
      "Notifications: unable to parse API URL, using window origin",
      error
    );
    return fallback;
  }
};

const buildItem = (
  payload: Partial<ClientNotification>
): ClientNotification => ({
  id: payload.id || crypto.randomUUID(),
  event: payload.event || "notification",
  title: payload.title,
  message: payload.message,
  status: payload.status,
  receivedAt: payload.receivedAt || new Date().toISOString(),
  read: Boolean(payload.read ?? false),
  ...payload,
});

export const NotificationsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [notifications, setNotifications] = useState<ClientNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const hasWarnedRef = useRef(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const baseUrl = resolveBaseUrl();
    const socketUrl = `${baseUrl}${DEFAULT_NAMESPACE}`;

    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token: accessToken },
    });
    socketRef.current = socket;

    socket.on("connect_error", (error) => {
      if (hasWarnedRef.current) {
        return;
      }
      hasWarnedRef.current = true;
      console.warn("Notifications socket connection failed", error);
    });

    socket.on("notification", (payload: Partial<ClientNotification>) => {
      hasWarnedRef.current = false;
      setNotifications((prev) => {
        const item = buildItem(payload);
        return [item, ...prev].slice(0, MAX_ITEMS);
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo<NotificationsContextValue>(() => {
    const unreadCount = notifications.filter((item) => !item.read).length;
    return {
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clear,
    };
  }, [notifications, markAsRead, markAllAsRead, clear]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = (): NotificationsContextValue => {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used within NotificationsProvider"
    );
  }
  return ctx;
};
