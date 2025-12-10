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

export interface Card {
  id: string;
  account_id: string;
  card_number: string;
  type: 'VIRTUAL' | 'PHYSICAL';
  status: 'ACTIVE' | 'BLOCKED' | 'EXPIRED';
  cvv: string;
  expiry_date: string;
  cardholder_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  amount: string;
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER';
  account_id?: string;
  card_id?: string;
  card_number?: string;
  category?: string;
  description?: string;
  status?: string;
  created_at: string;
}
