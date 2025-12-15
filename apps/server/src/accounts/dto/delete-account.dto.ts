export class DeleteAccountDto {
  /**
   * Reason for account deletion (optional but recommended for audit trail)
   * @example "User requested permanent account closure"
   */
  reason?: string;

  /**
   * If true, permanently delete after soft-delete grace period
   * If false (default), soft-delete with 90-day retention
   */
  permanent?: boolean;
}
