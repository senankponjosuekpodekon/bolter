export interface AdminAccount {
  id: string;
  user_id: string;
  account_number: string;
  account_type: string;
  balance: number;
  status: string;
  created_at: string;
  updated_at: string;
  user?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}
