import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

// Simple UUID generator for browser
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));

    // Auto-remove toast after duration (default 5s)
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }

    return id;
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Helper functions for convenience
export const toast = {
  success: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, title, duration }),

  error: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', message, title, duration }),

  info: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, title, duration }),

  warning: (message: string, title?: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, title, duration }),
};
