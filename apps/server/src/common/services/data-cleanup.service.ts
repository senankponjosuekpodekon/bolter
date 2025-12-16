import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { AuditLogsService } from '../../audit-logs/audit-logs.service';

/**
 * DataCleanupService handles cascading deletion and soft-delete cleanup
 * for RGPD compliance. Manages:
 * - Cascading file deletion when accounts/users are deleted
 * - Permanent purge of soft-deleted records after retention period
 */
@Injectable()
export class DataCleanupService {
  private readonly logger = new Logger(DataCleanupService.name);
  private readonly RETENTION_DAYS = 90; // RGPD retention period

  constructor(
    private supabase: SupabaseService,
    private auditLogsService: AuditLogsService,
  ) { }

  /**
   * Delete all user files (avatars, KYC documents) when account is deleted
   * @param userId User ID whose files should be deleted
   * @returns Number of files deleted
   */
  async deleteUserFiles(userId: string): Promise<number> {
    let deletedCount = 0;

    try {
      // Delete avatars
      const avatarCount = await this.deleteAvatars(userId);
      deletedCount += avatarCount;

      // Delete KYC documents
      const kycCount = await this.deleteKycDocuments(userId);
      deletedCount += kycCount;

      this.logger.log(`Deleted ${deletedCount} files for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user files for ${userId}:`, error);
      throw error;
    }

    return deletedCount;
  }

  /**
   * Delete all avatar files for a user
   * @private
   */
  private async deleteAvatars(userId: string): Promise<number> {
    try {
      const client = this.supabase.getAdminClient();
      const { data: files, error: listError } = await client.storage
        .from('profile-avatars')
        .list(`${userId}`);

      if (listError) {
        this.logger.warn(`Failed to list avatar files for user ${userId}: ${listError.message}`);
        return 0;
      }

      if (!files || files.length === 0) {
        return 0;
      }

      // Delete each file
      for (const file of files) {
        const { error: deleteError } = await client.storage
          .from('profile-avatars')
          .remove([`${userId}/${file.name}`]);

        if (deleteError) {
          this.logger.warn(`Failed to delete avatar ${userId}/${file.name}: ${deleteError.message}`);
        }
      }

      return files.length;
    } catch (error) {
      this.logger.warn(`Error deleting avatars for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Delete all KYC documents for a user
   * @private
   */
  private async deleteKycDocuments(userId: string): Promise<number> {
    try {
      const client = this.supabase.getAdminClient();
      const { data: userFolders, error: listError } = await client.storage
        .from('kyc-documents')
        .list(`${userId}`);

      if (listError) {
        this.logger.warn(`Failed to list KYC folders for user ${userId}: ${listError.message}`);
        return 0;
      }

      if (!userFolders || userFolders.length === 0) {
        return 0;
      }

      let deletedCount = 0;

      // Delete each document type folder and its contents
      for (const folder of userFolders) {
        if (folder.name && folder.id) {
          // Recursively list and delete documents in each type folder
          const { data: documents, error: docListError } = await client.storage
            .from('kyc-documents')
            .list(`${userId}/${folder.name}`);

          if (!docListError && documents) {
            for (const doc of documents) {
              const { error: deleteError } = await client.storage
                .from('kyc-documents')
                .remove([`${userId}/${folder.name}/${doc.name}`]);

              if (!deleteError) {
                deletedCount++;
              }
            }
          }
        }
      }

      return deletedCount;
    } catch (error) {
      this.logger.warn(`Error deleting KYC documents for user ${userId}:`, error);
      return 0;
    }
  }

  /**
   * Purge soft-deleted records older than retention period (90 days)
   * Should be called by a scheduled cron job
   * @returns Object with counts of purged records
   */
  async purgeSoftDeletedRecords(): Promise<{ accountsPurged: number; usersPurged: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);
    const cutoffIso = cutoffDate.toISOString();

    let accountsPurged = 0;
    let usersPurged = 0;

    try {
      // Purge soft-deleted accounts older than 90 days
      const { data: accountsToDelete, error: fetchAccountsError } = await this.supabase
        .getAdminClient()
        .from('accounts')
        .select('id, user_id')
        .lt('deleted_at', cutoffIso)
        .not('deleted_at', 'is', null);

      if (!fetchAccountsError && accountsToDelete) {
        for (const account of accountsToDelete) {
          const { error: deleteError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .delete()
            .eq('id', account.id);

          if (!deleteError) {
            accountsPurged++;
            await this.auditLogsService.log({
              userId: account.user_id,
              performedBy: 'system',
              action: 'ACCOUNT_PERMANENTLY_DELETED',
              resourceType: 'account',
              resourceId: account.id,
              metadata: {
                reason: 'RGPD 90-day retention period expired',
                purgedDate: new Date().toISOString(),
              },
            });
          }
        }
      }

      // Purge soft-deleted users older than 90 days (cascading: delete their files first)
      const { data: usersToDelete, error: fetchUsersError } = await this.supabase
        .getAdminClient()
        .from('users')
        .select('id')
        .lt('deleted_at', cutoffIso)
        .not('deleted_at', 'is', null);

      if (!fetchUsersError && usersToDelete) {
        for (const user of usersToDelete) {
          try {
            // First delete all user files (cascade)
            await this.deleteUserFiles(user.id);

            // Then delete the user record
            const { error: deleteError } = await this.supabase
              .getAdminClient()
              .from('users')
              .delete()
              .eq('id', user.id);

            if (!deleteError) {
              usersPurged++;
              await this.auditLogsService.log({
                userId: user.id,
                performedBy: 'system',
                action: 'USER_PERMANENTLY_DELETED',
                resourceType: 'user',
                resourceId: user.id,
                metadata: {
                  reason: 'RGPD 90-day retention period expired',
                  purgedDate: new Date().toISOString(),
                  cascadedDelete: true,
                },
              });
            }
          } catch (error) {
            this.logger.error(`Failed to purge user ${user.id}:`, error);
          }
        }
      }

      this.logger.log(
        `Purge complete: ${accountsPurged} accounts, ${usersPurged} users deleted (90+ days old)`,
      );
    } catch (error) {
      this.logger.error('Failed to purge soft-deleted records:', error);
      throw error;
    }

    return { accountsPurged, usersPurged };
  }
}
