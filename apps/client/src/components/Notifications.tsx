import React from "react";
import { useNotifications } from "../lib/useNotifications";

export const Notifications: React.FC = () => {
  const notifications = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 w-96">
      {notifications.map((notif, idx) => (
        <div
          key={idx}
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
