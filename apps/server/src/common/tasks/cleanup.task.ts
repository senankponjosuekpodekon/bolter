import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataCleanupService } from '../common/services/data-cleanup.service';

/**
 * CleanupTaskService handles scheduled cleanup tasks for RGPD compliance
 * - Purges soft-deleted records after 90-day retention period
 * - Archives old audit logs
 */
@Injectable()
export class CleanupTaskService {
  private readonly logger = new Logger(CleanupTaskService.name);

  constructor(private dataCleanupService: DataCleanupService) { }

  /**
   * Purge soft-deleted records every day at 2 AM
   * (Runs daily to clean up records older than 90 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async purgeSoftDeletedRecords() {
    try {
      this.logger.log('Starting purge of soft-deleted records (90+ days)...');
      const result = await this.dataCleanupService.purgeSoftDeletedRecords();
      this.logger.log(
        `Purge completed: ${result.accountsPurged} accounts and ${result.usersPurged} users permanently deleted`,
      );
    } catch (error) {
      this.logger.error('Failed to purge soft-deleted records:', error);
    }
  }

  /**
   * Run purge immediately for testing/manual trigger
   * (Call this manually in controllers/admin endpoints if needed)
   */
  async runPurgeNow() {
    return this.dataCleanupService.purgeSoftDeletedRecords();
  }
}
