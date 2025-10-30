import { useMemo, useState, type MouseEvent } from "react";
import { useNotifications } from "../lib/notifications";

const MAX_PREVIEW = 8;

const formatRelative = (iso: string): string => {
  const value = new Date(iso).getTime();
  if (Number.isNaN(value)) {
    return "";
  }
  const diff = Date.now() - value;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) {
    return "Just now";
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} h ago`;
  }
  const days = Math.round(hours / 24);
  if (days < 7) {
    return `${days} d ago`;
  }
  return new Date(iso).toLocaleDateString();
};

export const NotificationBell = () => {
  const { notifications, unreadCount, markAllAsRead, markAsRead, clear } =
    useNotifications();
  const [open, setOpen] = useState(false);

  const recent = useMemo(
    () => notifications.slice(0, MAX_PREVIEW),
    [notifications]
  );

  const handleToggle = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setOpen((prev) => !prev);
    if (!open && unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClose = () => setOpen(false);

  const handleItemClick = (id: string) => {
    markAsRead(id);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative rounded-full p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="sr-only">Open notifications</span>
        <svg
          className="h-6 w-6"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 1 0-12 0v.75a8.967 8.967 0 0 1-2.311 6.022c1.742.64 3.55 1.085 5.455 1.31m5.713 0a24.255 24.255 0 0 1-5.713 0m5.713 0a3 3 0 1 1-5.713 0"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-xs font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-20 mt-2 w-80 origin-top-right rounded-lg border border-gray-200 bg-white shadow-lg"
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">
                Notifications
              </p>
              <p className="text-xs text-gray-500">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
                onClick={() => {
                  markAllAsRead();
                  handleClose();
                }}
              >
                Mark all
              </button>
              <button
                type="button"
                className="text-xs font-medium text-gray-500 hover:text-gray-700"
                onClick={() => {
                  clear();
                  handleClose();
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto border-t border-gray-100">
            {recent.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              <ul>
                {recent.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full px-4 py-3 text-left text-sm ${
                        item.read
                          ? "bg-white hover:bg-gray-50"
                          : "bg-blue-50 hover:bg-blue-100"
                      }`}
                    >
                      <p className="font-medium text-gray-900">
                        {item.title || "Notification"}
                      </p>
                      <p className="mt-1 text-gray-600">
                        {item.message || item.event}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-wide text-gray-400">
                        {formatRelative(item.receivedAt)}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-10"
          onClick={handleClose}
          aria-hidden="true"
        />
      ) : null}
    </div>
  );
};
