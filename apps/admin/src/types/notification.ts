export interface NotificationPayload {
  id?: string;
  type: string;
  message: string;
  createdAt?: string;
  [key: string]: unknown;
  payload?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
