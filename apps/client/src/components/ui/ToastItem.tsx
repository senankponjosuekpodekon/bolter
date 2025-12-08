import React from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { Toast, ToastType } from "../../stores/toastStore";

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const getToastStyles = (type: ToastType) => {
  const baseStyles =
    "flex items-start gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full duration-300";

  switch (type) {
    case "success":
      return `${baseStyles} bg-green-50 border-green-200 text-green-800 dark:bg-green-900 dark:border-green-700 dark:text-green-100`;
    case "error":
      return `${baseStyles} bg-red-50 border-red-200 text-red-800 dark:bg-red-900 dark:border-red-700 dark:text-red-100`;
    case "warning":
      return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100`;
    case "info":
    default:
      return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-100`;
  }
};

const getIconStyles = (type: ToastType) => {
  switch (type) {
    case "success":
      return "text-green-600 dark:text-green-400 flex-shrink-0";
    case "error":
      return "text-red-600 dark:text-red-400 flex-shrink-0";
    case "warning":
      return "text-yellow-600 dark:text-yellow-400 flex-shrink-0";
    case "info":
    default:
      return "text-blue-600 dark:text-blue-400 flex-shrink-0";
  }
};

const getIcon = (type: ToastType) => {
  switch (type) {
    case "success":
      return <CheckCircle className={getIconStyles(type)} size={20} />;
    case "error":
      return <AlertCircle className={getIconStyles(type)} size={20} />;
    case "warning":
      return <AlertTriangle className={getIconStyles(type)} size={20} />;
    case "info":
    default:
      return <Info className={getIconStyles(type)} size={20} />;
  }
};

export const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  return (
    <div className={getToastStyles(toast.type)} role="alert">
      <div className="flex-shrink-0">{getIcon(toast.type)}</div>

      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm">{toast.title}</div>
        )}
        <div className="text-sm mt-1">{toast.message}</div>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded px-2 py-1"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="flex-shrink-0 ml-2 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};
