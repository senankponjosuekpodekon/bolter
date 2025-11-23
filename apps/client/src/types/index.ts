export interface Account {
  id: string;
  balance: string;
  currency: string;
  account_type?: string;
  account_number?: string;
  status?: string;
  limit?: number;
  created_at?: string;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  category?: string;
  description?: string;
  status?: string;
  created_at: string;
}
