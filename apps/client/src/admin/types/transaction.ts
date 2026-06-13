export interface AdminTransaction {
  id: string;
  type: "TRANSFER" | "DEPOSIT" | "WITHDRAWAL";
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELLED";
  fromAccount?: {
    id?: string;
    account_number: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      id?: string;
    };
    user_id?: string | null;
  };
  toAccount?: {
    id?: string;
    account_number: string;
    user?: {
      first_name?: string;
      last_name?: string;
      email?: string;
      id?: string;
    };
    user_id?: string | null;
  };
  iban_external?: string;
  description?: string;
  validator?: { email?: string };
  validated_by?: string;
  created_at?: string;
  validated_at?: string;
}
