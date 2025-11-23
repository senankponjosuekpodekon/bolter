export interface AdminAuditLog {
  id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  performedBy?: string;
  user_id?: string;
  changes?: Record<string, string | number | boolean | null | undefined | object>;
  created_at?: string;
}
