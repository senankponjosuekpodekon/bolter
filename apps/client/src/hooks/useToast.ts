import { useCallback } from 'react';
import { useToastStore, ToastType } from '../stores/toastStore';

export const useToast = () => {
    const addToast = useToastStore((state) => state.addToast);

    const showToast = useCallback(
        (message: string, type: ToastType = 'info', title?: string, duration?: number) => {
            return addToast({
                type,
                title,
                message,
                duration,
            });
        },
        [addToast]
    );

    const success = useCallback(
        (message: string, title?: string, duration?: number) => {
            return showToast(message, 'success', title, duration);
        },
        [showToast]
    );

    const error = useCallback(
        (message: string, title?: string, duration?: number) => {
            return showToast(message, 'error', title, duration);
        },
        [showToast]
    );

    const info = useCallback(
        (message: string, title?: string, duration?: number) => {
            return showToast(message, 'info', title, duration);
        },
        [showToast]
    );

    const warning = useCallback(
        (message: string, title?: string, duration?: number) => {
            return showToast(message, 'warning', title, duration);
        },
        [showToast]
    );

    return {
        showToast,
        success,
        error,
        info,
        warning,
    };
};
