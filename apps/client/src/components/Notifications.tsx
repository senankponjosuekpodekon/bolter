import React, { useEffect, useState, useRef } from "react";
import { useNotifications as useNotificationsFromLib } from "../lib/useNotifications";

const AUTO_DISMISS_DELAY = 10000; // 10 seconds

export const Notifications: React.FC = () => {
  const notificationsFromSocket = useNotificationsFromLib();
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    // Add new notification IDs to visible set
    notificationsFromSocket.forEach((notif) => {
      if (!visibleIds.has(notif.id) && !timeoutsRef.current.has(notif.id)) {
        setVisibleIds((prev) => new Set(prev).add(notif.id));

        // Set timeout to remove this notification
        const timeout = setTimeout(() => {
          setVisibleIds((prev) => {
            const next = new Set(prev);
            next.delete(notif.id);
            return next;
          });
          timeoutsRef.current.delete(notif.id);
        }, AUTO_DISMISS_DELAY);

        timeoutsRef.current.set(notif.id, timeout);
      }
    });
  }, [notificationsFromSocket]);

  // Filter notifications to only show visible ones
  const visibleNotifications = notificationsFromSocket.filter((n) =>
    visibleIds.has(n.id)
  );

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      {visibleNotifications.map((notif) => (
        <div
          key={notif.id}
          className="bg-white shadow-lg rounded p-4 mb-2 border border-blue-200 animate-fade-in"
        >
          <strong>
            {typeof notif.title === "string" ? notif.title : "Notification"}
          </strong>
          <div>
            {typeof notif.message === "string"
              ? notif.message
              : JSON.stringify(notif)}
          </div>
        </div>
      ))}
    </div>
  );
};
