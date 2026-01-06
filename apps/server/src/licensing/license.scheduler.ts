import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LicensingService } from '../licensing.service';
import { SupabaseService } from '../../database/supabase.service';

/**
 * Scheduled tasks for license management
 */
@Injectable()
export class LicenseScheduler {
  private readonly logger = new Logger(LicenseScheduler.name);

  constructor(
    private licensingService: LicensingService,
    private supabase: SupabaseService,
  ) {}

  /**
   * Mark expired licenses (daily at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredLicenses() {
    try {
      this.logger.log('Running license expiration check...');
      await this.licensingService.markExpiredLicenses();
      this.logger.log('License expiration check completed');
    } catch (error) {
      this.logger.error('Error marking expired licenses:', error);
    }
  }

  /**
   * Auto-renew eligible licenses (daily at 1 AM)
   */
  @Cron('0 1 * * *') // 01:00 every day
  async handleAutoRenewal() {
    try {
      this.logger.log('Running auto-renewal check...');
      await this.licensingService.autoRenewExpiredLicenses();
      this.logger.log('Auto-renewal check completed');
    } catch (error) {
      this.logger.error('Error auto-renewing licenses:', error);
    }
  }

  /**
   * Send expiration alerts (daily at 8 AM)
   */
  @Cron('0 8 * * *') // 08:00 every day
  async sendExpirationAlerts() {
    try {
      this.logger.log('Checking for licenses expiring soon...');

      // Get licenses expiring in 7 days
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const { data: expiringLicenses, error } = await this.supabase
        .getAdminClient()
        .from('licenses')
        .select('l:*, t:tenants(*)')
        .eq('status', 'ACTIVE')
        .lte('expires_at', sevenDaysFromNow.toISOString())
        .gt('expires_at', new Date().toISOString());

      if (error) {
        this.logger.error(`Failed to fetch expiring licenses: ${error.message}`);
        return;
      }

      for (const license of expiringLicenses || []) {
        // TODO: Send email to tenant contact
        this.logger.log(
          `License ${license.id} expiring on ${license.expires_at} for tenant`,
        );
      }

      this.logger.log('Expiration alert check completed');
    } catch (error) {
      this.logger.error('Error sending expiration alerts:', error);
    }
  }

  /**
   * Reset monthly usage counters (first day of month at midnight)
   */
  @Cron('0 0 1 * *') // 00:00 on the 1st of every month
  async resetMonthlyUsage() {
    try {
      this.logger.log('Resetting monthly usage counters...');

      // Get previous month
      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
      const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

      // Archive previous month's usage
      const { data: lastMonthUsage, error: fetchError } = await this.supabase
        .getAdminClient()
        .from('usage_tracking')
        .select('*')
        .eq('year_month', prevMonthStr);

      if (fetchError) {
        this.logger.error(`Failed to fetch last month usage: ${fetchError.message}`);
        return;
      }

      this.logger.log(`Archived usage data for ${prevMonthStr}: ${lastMonthUsage?.length || 0} records`);
    } catch (error) {
      this.logger.error('Error resetting monthly usage:', error);
    }
  }

  /**
   * Suspend tenants with expired licenses (daily at 2 AM)
   */
  @Cron('0 2 * * *') // 02:00 every day
  async suspendExpiredTenants() {
    try {
      this.logger.log('Checking for expired tenants to suspend...');

      // Get tenants with expired licenses
      const { data: expiredTenants, error } = await this.supabase
        .getAdminClient()
        .from('licenses')
        .select('tenant_id')
        .eq('status', 'EXPIRED')
        .lt('expires_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Expired 7+ days ago
        .distinct();

      if (error) {
        this.logger.error(`Failed to fetch expired tenants: ${error.message}`);
        return;
      }

      for (const record of expiredTenants || []) {
        // Update tenant status to SUSPENDED
        const { error: updateError } = await this.supabase
          .getAdminClient()
          .from('tenants')
          .update({ status: 'SUSPENDED' })
          .eq('id', record.tenant_id);

        if (updateError) {
          this.logger.error(`Failed to suspend tenant ${record.tenant_id}: ${updateError.message}`);
        } else {
          this.logger.log(`Suspended tenant ${record.tenant_id} due to expired license`);
        }
      }

      this.logger.log('Tenant suspension check completed');
    } catch (error) {
      this.logger.error('Error suspending expired tenants:', error);
    }
  }
}
