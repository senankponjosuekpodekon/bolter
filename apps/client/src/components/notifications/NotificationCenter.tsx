import React, { useState, useCallback } from 'react';
import { X, Bell, Trash2, CheckCircle, AlertCircle, Info } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'transaction' | 'kyc' | 'loan' | 'system' | 'report';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  data?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: (notificationId: string) => void;
  onDelete: (notificationId: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'transaction':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'kyc':
      return <AlertCircle className="w-5 h-5 text-blue-500" />;
    case 'loan':
      return <CheckCircle className="w-5 h-5 text-purple-500" />;
    case 'report':
      return <Info className="w-5 h-5 text-orange-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'transaction':
      return 'bg-green-50 border-green-200';
    case 'kyc':
      return 'bg-blue-50 border-blue-200';
    case 'loan':
      return 'bg-purple-50 border-purple-200';
    case 'report':
      return 'bg-orange-50 border-orange-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export default function NotificationCenter({
  notifications,
  unreadCount,
  onMarkAsRead,
  onDelete,
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const filteredNotifications = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleMarkAsRead = useCallback(
    (id: string) => {
      onMarkAsRead(id);
    },
    [onMarkAsRead],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Notification Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-white" />
            <h2 className="text-xl font-semibold text-white">Notifications</h2>
            {unreadCount > 0 && (
              <span className="ml-2 bg-red-500 text-white px-2.5 py-0.5 rounded-full text-sm font-medium">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-1 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 border-b border-gray-200 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Unread ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
              <Bell className="w-12 h-12 opacity-20 mb-3" />
              <p className="text-center font-medium">
                {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 cursor-pointer transition-colors hover:bg-opacity-80 ${
                    notification.read ? 'opacity-60 bg-gray-50' : getNotificationColor(notification.type)
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.message}</p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(notification.id);
                          }}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Additional Data */}
                  {notification.data && Object.keys(notification.data).length > 0 && (
                    <div className="mt-2 text-xs text-gray-600 bg-white/50 p-2 rounded border border-gray-200">
                      {Object.entries(notification.data).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="font-medium">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-600 text-center">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
