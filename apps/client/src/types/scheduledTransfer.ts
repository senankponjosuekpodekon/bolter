export interface ScheduledTransfer {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  currency: 'EUR' | 'USD' | 'GBP';
  date: string;
  recurrence: 'once' | 'monthly' | 'weekly';
  description?: string;
  userId?: string;
  status: string;
}
