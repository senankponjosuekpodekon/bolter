"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var LicensingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensingService = exports.LICENSE_CONFIGS = exports.LicenseTier = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
var LicenseTier;
(function (LicenseTier) {
    LicenseTier["STARTER"] = "STARTER";
    LicenseTier["PROFESSIONAL"] = "PROFESSIONAL";
    LicenseTier["ENTERPRISE"] = "ENTERPRISE";
})(LicenseTier || (exports.LicenseTier = LicenseTier = {}));
exports.LICENSE_CONFIGS = {
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
            monthly_transactions: -1,
            api_calls: -1,
            storage_gb: -1,
            active_users: -1,
        },
        price: 0,
        duration_days: 365,
    },
};
let LicensingService = LicensingService_1 = class LicensingService {
    constructor(supabase, auditLogs) {
        this.supabase = supabase;
        this.auditLogs = auditLogs;
        this.logger = new common_1.Logger(LicensingService_1.name);
    }
    async getActiveLicense(tenantId) {
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
        return license;
    }
    async hasFeature(tenantId, feature) {
        const license = await this.getActiveLicense(tenantId);
        if (!license) {
            this.logger.warn(`No active license for tenant: ${tenantId}`);
            return false;
        }
        if (new Date(license.expires_at) < new Date()) {
            return false;
        }
        return license.modules[feature] === true;
    }
    async validateFeature(tenantId, feature) {
        const hasFeature = await this.hasFeature(tenantId, feature);
        if (!hasFeature) {
            throw new common_1.BadRequestException(`Feature "${feature}" is not available for your license tier`);
        }
    }
    async getRemainingLimit(tenantId, feature, currentMonth) {
        const license = await this.getActiveLicense(tenantId);
        if (!license) {
            return 0;
        }
        const limit = license.limits[feature];
        if (limit === -1) {
            return -1;
        }
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
    async checkRateLimit(tenantId, feature) {
        const license = await this.getActiveLicense(tenantId);
        if (!license) {
            return true;
        }
        const limit = license.limits[feature];
        if (limit === -1) {
            return false;
        }
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
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
    async incrementUsage(tenantId, feature, amount = 1) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const { data: existingUsage } = await this.supabase
            .getAdminClient()
            .from('usage_tracking')
            .select('id, count')
            .eq('tenant_id', tenantId)
            .eq('year_month', currentMonth)
            .eq('feature', feature)
            .single();
        if (existingUsage) {
            await this.supabase
                .getAdminClient()
                .from('usage_tracking')
                .update({ count: existingUsage.count + amount })
                .eq('id', existingUsage.id);
        }
        else {
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
    async upgradeLicense(tenantId, newTier, upgradedBy) {
        const currentLicense = await this.getActiveLicense(tenantId);
        if (!currentLicense) {
            throw new common_1.NotFoundException('No active license found');
        }
        await this.supabase
            .getAdminClient()
            .from('licenses')
            .update({ status: 'CANCELLED' })
            .eq('id', currentLicense.id);
        await this.recordLicenseHistory(tenantId, currentLicense.id, 'UPGRADED', currentLicense.tier, newTier);
        const config = exports.LICENSE_CONFIGS[newTier];
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
            throw new common_1.BadRequestException('Failed to upgrade license');
        }
        await this.auditLogs.log({
            action: 'LICENSE_UPGRADE',
            resourceType: 'LICENSE',
            resourceId: newLicense.id,
            performedBy: upgradedBy,
            metadata: { description: `Upgraded license from ${currentLicense.tier} to ${newTier}` },
        });
        return newLicense;
    }
    async recordLicenseHistory(tenantId, licenseId, action, oldTier, newTier) {
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
    async autoRenewExpiredLicenses() {
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
                const config = exports.LICENSE_CONFIGS[license.tier];
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
            }
            catch (err) {
                this.logger.error(`Error renewing license ${license.id}:`, err);
            }
        }
    }
    async markExpiredLicenses() {
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
};
exports.LicensingService = LicensingService;
exports.LicensingService = LicensingService = LicensingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService])
], LicensingService);
//# sourceMappingURL=licensing.service.js.map