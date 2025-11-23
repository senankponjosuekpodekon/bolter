export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  role: "CLIENT" | "ADMIN" | "COMPLIANCE";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "CLOSED";
  kyc_status: "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
  language?: string;
  notificationsEnabled?: boolean;
  hasPassword?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
