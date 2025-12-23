/**
 * Reusable modal components for tontine management
 * Supports light and dark themes
 */

import { ReactNode } from 'react';

/**
 * Modal overlay and container with theme support
 */
export const Modal = ({
  open,
  children,
  maxWidth = 'max-w-3xl',
}: {
  open: boolean;
  children: ReactNode;
  maxWidth?: string;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur p-4">
      <div
        className={`dark:bg-slate-900 dark:border-slate-700 bg-white shadow-2xl rounded-2xl w-full ${maxWidth} max-h-[85vh] overflow-y-auto`}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * Modal header with close button
 */
export const ModalHeader = ({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) => (
  <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b dark:border-slate-700 dark:bg-slate-800 bg-white">
    <div className="flex-1 pr-2">
      <p className="text-xs uppercase tracking-wide dark:text-slate-400 text-slate-500">
        {subtitle}
      </p>
      <h2 className="text-lg font-semibold dark:text-white text-slate-900">
        {title}
      </h2>
    </div>
    <button
      onClick={onClose}
      className="dark:text-slate-400 dark:hover:text-white text-slate-500 hover:text-slate-800 text-2xl leading-none flex-shrink-0 transition"
    >
      ×
    </button>
  </div>
);

/**
 * Modal footer with actions
 */
export const ModalFooter = ({
  onClose,
  actions,
}: {
  onClose: () => void;
  actions?: ReactNode;
}) => (
  <div className="sticky bottom-0 border-t dark:border-slate-700 dark:bg-slate-800 bg-white px-6 py-4 flex justify-between">
    <div>{actions}</div>
    <button
      onClick={onClose}
      className="px-4 py-2 rounded-lg border dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700 border-slate-200 text-slate-700 hover:bg-slate-50 font-medium transition"
    >
      Fermer
    </button>
  </div>
);

/**
 * Modal content wrapper with padding
 */
export const ModalContent = ({ children }: { children: ReactNode }) => (
  <div className="px-6 py-4 space-y-6 pb-8">{children}</div>
);

/**
 * Info box for displaying error messages
 */
export const InfoBox = ({
  type = 'info',
  children,
}: {
  type?: 'info' | 'error' | 'success' | 'warning';
  children: ReactNode;
}) => {
  const styles = {
    info: 'dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200 border-blue-200 bg-blue-50 text-blue-800',
    error: 'dark:border-red-900 dark:bg-red-950 dark:text-red-300 border-red-200 bg-red-50 text-red-800',
    success: 'dark:border-green-900 dark:bg-green-950 dark:text-green-200 border-green-200 bg-green-50 text-green-800',
    warning: 'dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 border-amber-200 bg-amber-50 text-amber-800',
  };

  return (
    <div className={`border rounded-lg p-3 text-sm ${styles[type]}`}>
      {children}
    </div>
  );
};

/**
 * Loading spinner
 */
export const LoadingSpinner = ({
  message = 'Chargement…',
}: {
  message?: string;
}) => (
  <div className="flex items-center justify-center gap-3 p-12 dark:text-slate-300 text-slate-600">
    <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
    <span>{message}</span>
  </div>
);

/**
 * Data table for displaying member information
 */
export const DataTable = ({
  headers,
  rows,
  empty = 'Aucune donnée',
}: {
  headers: string[];
  rows: (string | number | JSX.Element)[][];
  empty?: string;
}) => {
  if (rows.length === 0) {
    return (
      <div className="dark:bg-slate-800 dark:text-slate-300 text-center py-8 rounded-lg bg-slate-50 text-slate-600">
        {empty}
      </div>
    );
  }

  return (
    <div className="dark:bg-slate-800 rounded-lg overflow-hidden border dark:border-slate-700 border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="dark:bg-slate-700 bg-slate-50 border-b dark:border-slate-600 border-slate-200">
            {headers.map((header) => (
              <th
                key={header}
                className="dark:text-slate-300 text-left px-4 py-3 text-slate-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className="dark:border-slate-700 border-t dark:hover:bg-slate-700 border-slate-200 hover:bg-slate-50 transition"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="dark:text-slate-300 px-4 py-3 text-slate-700"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
