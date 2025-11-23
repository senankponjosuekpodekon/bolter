import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NotificationType, useNotify } from "react-admin";
import { io, Socket } from "socket.io-client";

type NotificationPayload = {
  id: string;
  event: string;
  title?: string;
  message?: string;
  status?: string;
  createdAt?: string;
  [key: string]: unknown;
};

type NotificationItem = NotificationPayload & {
  createdAt: string;
  read: boolean;
};

type NotificationsContextValue = {
  notifications: NotificationItem[];
  unreadCount: number;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clear: () => void;
};

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

const DEFAULT_NAMESPACE = "/notifications";

function resolveBaseUrl(): string {
  const preferred =
    import.meta.env.VITE_NOTIFICATIONS_URL || import.meta.env.VITE_API_URL;
  const fallback = window.location.origin;
  try {
    const url = new URL(preferred || fallback, window.location.origin);
    const trimmedPath = url.pathname
      .replace(/\/?api\/?$/, "")
      .replace(/\/$/, "");
    return `${url.origin}${trimmedPath ? trimmedPath : ""}`;
  } catch (error) {
    console.warn(
      "NotificationsProvider: unable to parse API URL, using window origin",
      error
    );
    return fallback;
  }
}

function resolveType(payload: NotificationPayload): NotificationType {
  if (payload.status === "REJECTED") {
    return "warning";
  }
  if (payload.status === "FAILED" || payload.event?.includes("error")) {
    return "warning";
  }
  return "info";
}

function buildItem(payload: NotificationPayload): NotificationItem {
  const createdAt = payload.createdAt || new Date().toISOString();
  return {
    ...payload,
    createdAt,
    read: false,
  };
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const notify = useNotify();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const hasWarnedRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const baseUrl = resolveBaseUrl();
    const socketUrl = `${baseUrl}${DEFAULT_NAMESPACE}`;

    const socket = io(socketUrl, {
      transports: ["websocket"],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect_error", (error) => {
      if (hasWarnedRef.current) {
        return;
      }
      hasWarnedRef.current = true;
      console.warn("Notifications socket connection failed", error);
      notify("Connexion temps reel indisponible", { type: "warning" });
    });

    socket.on("notification", (payload: NotificationPayload) => {
      try {
        hasWarnedRef.current = false;
        const item = buildItem(payload);
        // Defer state updates/notifications to avoid React setState-in-render warnings
        queueMicrotask(() => {
          try {
            setNotifications((prev) => [item, ...prev].slice(0, 20));
            const title = item.title || "Nouvelle notification";
            const message = item.message || title;
            const formatted =
              title === message ? title : `${title} - ${message}`;
            notify(formatted, { type: resolveType(item) });
          } catch (err) {
            // Log notification handling errors — keep outside router usage
            // eslint-disable-next-line no-console
            console.error("Error while processing notification", err, payload);
            // Save a compact debug entry that admin devs can inspect
            try {
              const existing = JSON.parse(
                localStorage.getItem("admin_notification_errors") || "[]"
              );
              existing.push({
                time: new Date().toISOString(),
                err: String((err as Error).message ?? err),
                payload,
              });
              localStorage.setItem(
                "admin_notification_errors",
                JSON.stringify(existing.slice(-50))
              );
            } catch {
              // ignore
            }
          }
        });
      } catch (err) {
        // Outer-level safety for unexpected errors
        // eslint-disable-next-line no-console
        console.error("Notification listener crash", err, payload);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [notify]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications]
  );

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item))
    );
  }, []);

  const clear = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(
    () => ({ notifications, unreadCount, markAllAsRead, markAsRead, clear }),
    [notifications, unreadCount, markAllAsRead, markAsRead, clear]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotificationsCenter(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      "useNotificationsCenter must be used within NotificationsProvider"
    );
  }
  return context;
}

export type { NotificationItem };
