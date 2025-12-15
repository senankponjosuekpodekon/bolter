# RGPD Account Deletion & Data Cleanup Implementation

## Summary

Implemented RGPD-compliant account deletion with soft-delete pattern and cascading file cleanup. Users can now delete their accounts with a 90-day data retention period, after which all associated files and records are permanently purged.

## Features Implemented

### 1. Account Soft-Delete (Compliance)
- **Migration**: `0005_add_soft_delete_accounts.sql`
  - Added `deleted_at` and `deletion_reason` columns to `accounts` and `users` tables
  - Created indexes for fast queries on soft-deleted and active records
  
- **Endpoint**: `DELETE /accounts/:id`
  - User can delete their own accounts
  - Marks account as `DELETED` with soft-delete timestamp
  - Optional permanent deletion on request
  - Notification email sent to user

- **Delete Account DTO**: `DeleteAccountDto`
  - `reason`: Optional deletion reason for audit trail
  - `permanent`: Force immediate permanent deletion (vs. 90-day soft-delete)

### 2. Cascading File Cleanup
- **Service**: `DataCleanupService` (`src/common/services/data-cleanup.service.ts`)
  - `deleteUserFiles(userId)`: Delete all user files (avatars, KYC documents) from Supabase Storage
  - `deleteAvatars(userId)`: Delete profile avatar files from `profile-avatars` bucket
  - `deleteKycDocuments(userId)`: Delete KYC documents from `kyc-documents` bucket (recursive)
  - Graceful error handling: logs failures but doesn't interrupt account deletion

- **Cascading Flow**:
  1. User/Admin deletes account → soft-delete in DB
  2. If permanent deletion requested → delete all user files immediately
  3. Scheduled cron job deletes soft-deleted records after 90 days
  4. Cascade: When purging user record → delete all remaining files first

### 3. Scheduled Cleanup Task (RGPD)
- **Service**: `CleanupTaskService` (`src/common/tasks/cleanup.task.ts`)
  - `@Cron(EVERY_DAY_AT_2AM)` decorator
  - Automatically purges soft-deleted records older than 90 days
  - Permanent deletes accounts and users from database
  - Logs audit trail for each purged record
  - Can be manually triggered via `runPurgeNow()` method

### 4. Notifications
- **New Method**: `notifyAccountDeleted(userId, accountNumber)` in `NotificationsService`
  - Sends WebSocket notification to user
  - Sends email with RGPD retention notice
  - Explains 90-day retention and option to contact support

### 5. Audit Logging
- Account deletion action logged with:
  - `action: 'ACCOUNT_DELETED'` or `'ACCOUNT_PERMANENTLY_DELETED'`
  - Metadata: reason, retention period, cascading deletion flag
  - Performed by system for cron job deletions

## Files Modified/Created

### New Files
- `apps/server/migrations/0005_add_soft_delete_accounts.sql`
- `apps/server/src/accounts/dto/delete-account.dto.ts`
- `apps/server/src/common/services/data-cleanup.service.ts`
- `apps/server/src/common/tasks/cleanup.task.ts`

### Modified Files
- `apps/server/src/accounts/accounts.controller.ts` (added DELETE endpoint)
- `apps/server/src/accounts/accounts.service.ts` (added delete method with cleanup)
- `apps/server/src/accounts/accounts.module.ts` (added imports for cleanup + notifications)
- `apps/server/src/notifications/notifications.service.ts` (added notifyAccountDeleted)

## Configuration

No additional environment variables needed. The cron job runs daily at 2 AM UTC.

To manually trigger cleanup:
```typescript
// In admin controller or scheduled task
const result = await this.cleanupTaskService.runPurgeNow();
console.log(`Purged: ${result.accountsPurged} accounts, ${result.usersPurged} users`);
```

## RGPD Compliance

✅ **Right to be forgotten**: Soft-delete with option for immediate permanent deletion
✅ **Data retention**: 90-day retention period aligns with common data protection practices
✅ **Audit trail**: All deletions logged with timestamps and reasons
✅ **Cascading deletion**: All associated files deleted when accounts deleted
✅ **Notification**: User notified of deletion and retention period
✅ **Scheduled purge**: Automated cleanup of retained data after period expires

## Next Steps

1. **Migration Deployment**: Run migration on production database
2. **Testing**: Test soft-delete flow, file cleanup, and cron job
3. **Admin Endpoint** (optional): Add admin endpoint to trigger purge manually or check soft-deleted records
4. **User Interface**: Add "Delete Account" button in settings with confirmation dialog
5. **Rate Limiting per User**: 10 uploads/hour per user (next feature)

## Testing Checklist

- [ ] DELETE /accounts/:id marks account as deleted
- [ ] Avatars deleted when account deleted
- [ ] KYC documents deleted when account deleted
- [ ] Email notification sent to user
- [ ] Audit log entry created
- [ ] Soft-deleted records not returned in normal queries
- [ ] Cron job runs daily at 2 AM
- [ ] Records purged after 90 days
- [ ] Manual purge trigger works
- [ ] Cascading deletion completes without blocking account deletion
