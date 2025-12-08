import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { websocketService, NotificationPayload } from '../services/websocketService';
import { toast } from '../stores/toastStore';

export const useNotificationListener = () => {
  const { t } = useTranslation('notifications');

  useEffect(() => {
    // Subscribe to WebSocket notifications
    const unsubscribe = websocketService.onNotification((payload: NotificationPayload) => {
      const event = payload.event as string;
      const title = (payload.title as string) || t('toast.info');

      // Map notification events to toast messages
      switch (event) {
        case 'transaction.created':
          toast.info(t('messages.transactionCreated'), title);
          break;

        case 'transaction.updated':
          if (payload.status === 'APPROVED') {
            toast.success(t('messages.transactionApproved'), title);
          } else if (payload.status === 'REJECTED') {
            toast.error(t('messages.transactionRejected'), title);
          }
          break;

        case 'kyc.document.reviewed':
          if (payload.approved) {
            toast.success(t('messages.kycDocumentApproved'), title);
          } else {
            toast.error(t('messages.kycDocumentRejected'), title);
          }
          break;

        case 'kyc.status.changed':
          toast.info(t('messages.kycStatusChanged'), title);
          break;

        case 'account.created':
          toast.success(t('messages.accountCreated'), title);
          break;

        case 'loan.created':
          toast.info(t('messages.loanCreated'), title);
          break;

        case 'loan.approved':
          toast.success(t('messages.loanApproved'), title);
          break;

        case 'loan.rejected':
          toast.error(t('messages.loanRejected'), title);
          break;

        default:
          toast.info((payload.message as string) || t('toast.info'), title);
      }
    });

    return () => {
      unsubscribe?.();
    };
  }, [t]);
};
