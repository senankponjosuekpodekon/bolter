import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

export enum LicenseTier {
  STARTER = 'STARTER',
  PROFESSIONAL = 'PROFESSIONAL',
  ENTERPRISE = 'ENTERPRISE',
}

export interface LicenseConfig {
  tier: LicenseTier;
  modules: Record<string, boolean>;
  limits: Record<string, number>;
  price: number;
  duration_days: number;
}

export const LICENSE_CONFIGS: Record<LicenseTier, LicenseConfig> = {
  [LicenseTier.STARTER]: {
    tier: LicenseTier.STARTER,
    modules: {
      accounts: true,
      transactions: true,
      loans: false,
      cards: false,
      tontines: false,
    },
    limits: {
      monthly_transactions: 10000,
      api_calls: 100000,
      storage_gb: 1,
      active_users: 5,
    },
    price: 0,
    duration_days: 30,
  },
  [LicenseTier.PROFESSIONAL]: {
    tier: LicenseTier.PROFESSIONAL,
    modules: {
      accounts: true,
      transactions: true,
      loans: true,
      cards: true,
      tontines: true,
    },
    limits: {
      monthly_transactions: 100000,
      api_calls: 1000000,
      storage_gb: 10,
      active_users: 50,
    },
    price: 99,
    duration_days: 30,
  },
  [LicenseTier.ENTERPRISE]: {
    tier: LicenseTier.ENTERPRISE,
    modules: {
      accounts: true,
      transactions: true,
      loans: true,
      cards: true,
      tontines: true,
    },
    limits: {
      monthly_transactions: -1, // unlimited
      api_calls: -1,
      storage_gb: -1,
      active_users: -1,
    },
    price: 0, // custom pricing
    duration_days: 365,
  },
};

export interface License {
  id: string;
  tenant_id: string;
  tier: LicenseTier;
  starts_at: Date;
  expires_at: Date;
  auto_renew: boolean;
  modules: Record<string, boolean>;
  limits: Record<string, number>;
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class LicensingService {
  private readonly logger = new Logger(LicensingService.name);

  constructor(
    private supabase: SupabaseService,
    private auditLogs: AuditLogsService,
  ) {}

  /**
   * Get active license for tenant
   */
  async getActiveLicense(tenantId: string): Promise<License | null> {
    const { data: license, error } = await this.supabase
      .getAdminClient()
      .from('licenses')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE')
      .single();

    if (error && error.code !== 'PGRST116') {
      this.logger.error(`Failed to get license: ${error.message}`);
      return null;
    }

    return license as License | null;
  }

  /**
   * Check if feature is available for tenant
   */
  async hasFeature(tenantId: string, feature: string): Promise<boolean> {
    const license = await this.getActiveLicense(tenantId);

    if (!license) {
      this.logger.warn(`No active license for tenant: ${tenantId}`);
      return false;
    }

    // Check if license is expired
    if (new Date(license.expires_at) < new Date()) {
      return false;
    }

    // Check if feature is enabled in modules
    return license.modules[feature] === true;
  }

  /**
   * Validate feature access (throw if not available)
   */
  async validateFeature(tenantId: string, feature: string): Promise<void> {
    const hasFeature = await this.hasFeature(tenantId, feature);

    if (!hasFeature) {
      throw new BadRequestException(`Feature "${feature}" is not available for your license tier`);
    }
  }

  /**
   * Get remaining limit for a feature
   */
  async getRemainingLimit(tenantId: string, feature: string, currentMonth: string): Promise<number | -1> {
    const license = await this.getActiveLicense(tenantId);

    if (!license) {
      return 0;
    }

    const limit = license.limits[feature];

    if (limit === -1) {
      return -1; // unlimited
    }

    // Get current usage
    const { data: usage } = await this.supabase
      .getAdminClient()
      .from('usage_tracking')
      .select('count')
      .eq('tenant_id', tenantId)
      .eq('year_month', currentMonth)
      .eq('feature', feature)
      .single();

    const currentUsage = usage?.count || 0;
    return Math.max(0, limit - currentUsage);
  }

  /**
   * Check if rate limit is exceeded
   */
  async checkRateLimit(tenantId: string, feature: string): Promise<boolean> {
    const license = await this.getActiveLicense(tenantId);

    if (!license) {
      return true; // no license = rate limit exceeded
    }

    const limit = license.limits[feature];

    if (limit === -1) {
      return false; // unlimited
    }

    // Get current month
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get current usage
    const { data: usage } = await this.supabase
      .getAdminClient()
      .from('usage_tracking')
      .select('count')
      .eq('tenant_id', tenantId)
      .eq('year_month', currentMonth)
      .eq('feature', feature)
      .single();

    const currentUsage = usage?.count || 0;
    return currentUsage >= limit;
  }

  /**
   * Increment usage for a feature
   */
  async incrementUsage(tenantId: string, feature: string, amount = 1): Promise<void> {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Get or create usage record
    const { data: existingUsage } = await this.supabase
      .getAdminClient()
      .from('usage_tracking')
      .select('id, count')
      .eq('tenant_id', tenantId)
      .eq('year_month', currentMonth)
      .eq('feature', feature)
      .single();

    if (existingUsage) {
      // Update existing
      await this.supabase
        .getAdminClient()
        .from('usage_tracking')
        .update({ count: existingUsage.count + amount })
        .eq('id', existingUsage.id);
    } else {
      // Create new
      const license = await this.getActiveLicense(tenantId);
      const limit = license?.limits[feature] || 0;

      await this.supabase
        .getAdminClient()
        .from('usage_tracking')
        .insert([
          {
            tenant_id: tenantId,
            year_month: currentMonth,
            feature,
            count: amount,
            limit_value: limit,
          },
        ]);
    }
  }

  /**
   * Upgrade tenant license to new tier
   */
  async upgradeLicense(
    tenantId: string,
    newTier: LicenseTier,
    upgradedBy: string,
  ): Promise<License> {
    const currentLicense = await this.getActiveLicense(tenantId);

    if (!currentLicense) {
      throw new NotFoundException('No active license found');
    }

    // Cancel old license
    await this.supabase
      .getAdminClient()
      .from('licenses')
      .update({ status: 'CANCELLED' })
      .eq('id', currentLicense.id);

    // Record history
    await this.recordLicenseHistory(
      tenantId,
      currentLicense.id,
      'UPGRADED',
      currentLicense.tier,
      newTier,
    );

    // Create new license
    const config = LICENSE_CONFIGS[newTier];
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + config.duration_days);

    const { data: newLicense, error } = await this.supabase
      .getAdminClient()
      .from('licenses')
      .insert([
        {
          tenant_id: tenantId,
          tier: newTier,
          expires_at: expiresAt.toISOString(),
          modules: config.modules,
          limits: config.limits,
          status: 'ACTIVE',
        },
      ])
      .select()
      .single();

    if (error || !newLicense) {
      this.logger.error(`Failed to create new license: ${error?.message}`);
      throw new BadRequestException('Failed to upgrade license');
    }

    // Audit log
    await this.auditLogs.log({
      action: 'LICENSE_UPGRADE',
      resourceType: 'LICENSE',
      resourceId: newLicense.id,
      performedBy: upgradedBy,
      metadata: { description: `Upgraded license from ${currentLicense.tier} to ${newTier}` },
    });

    return newLicense as License;
  }

  /**
   * Record license history for audit
   */
  private async recordLicenseHistory(
    tenantId: string,
    licenseId: string,
    action: string,
    oldTier: string,
    newTier: string,
  ): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('license_history')
      .insert([
        {
          tenant_id: tenantId,
          license_id: licenseId,
          action,
          old_tier: oldTier,
          new_tier: newTier,
        },
      ]);

    if (error) {
      this.logger.error(`Failed to record license history: ${error.message}`);
    }
  }

  /**
   * Auto-renew licenses (cron job)
   */
  async autoRenewExpiredLicenses(): Promise<void> {
    const { data: expiredLicenses, error } = await this.supabase
      .getAdminClient()
      .from('licenses')
      .select('*')
      .eq('auto_renew', true)
      .eq('status', 'EXPIRED')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.logger.error(`Failed to fetch expired licenses: ${error.message}`);
      return;
    }

    for (const license of expiredLicenses || []) {
      try {
        const config = LICENSE_CONFIGS[license.tier as LicenseTier];
        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + config.duration_days);

        const { error: renewError } = await this.supabase
          .getAdminClient()
          .from('licenses')
          .update({
            status: 'ACTIVE',
            expires_at: newExpiresAt.toISOString(),
          })
          .eq('id', license.id);

        if (renewError) {
          this.logger.error(`Failed to renew license ${license.id}: ${renewError.message}`);
        }

        this.logger.log(`Auto-renewed license ${license.id} for tenant ${license.tenant_id}`);
      } catch (err) {
        this.logger.error(`Error renewing license ${license.id}:`, err);
      }
    }
  }

  /**
   * Mark expired licenses
   */
  async markExpiredLicenses(): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('licenses')
      .update({ status: 'EXPIRED' })
      .eq('status', 'ACTIVE')
      .lt('expires_at', new Date().toISOString());

    if (error) {
      this.logger.error(`Failed to mark expired licenses: ${error.message}`);
    }
  }
}
