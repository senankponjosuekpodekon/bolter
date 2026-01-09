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
var LicenseScheduler_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const licensing_service_1 = require("./licensing.service");
const supabase_service_1 = require("../supabase/supabase.service");
let LicenseScheduler = LicenseScheduler_1 = class LicenseScheduler {
    constructor(licensingService, supabase) {
        this.licensingService = licensingService;
        this.supabase = supabase;
        this.logger = new common_1.Logger(LicenseScheduler_1.name);
    }
    async handleExpiredLicenses() {
        try {
            this.logger.log('Running license expiration check...');
            await this.licensingService.markExpiredLicenses();
            this.logger.log('License expiration check completed');
        }
        catch (error) {
            this.logger.error('Error marking expired licenses:', error);
        }
    }
    async handleAutoRenewal() {
        try {
            this.logger.log('Running auto-renewal check...');
            await this.licensingService.autoRenewExpiredLicenses();
            this.logger.log('Auto-renewal check completed');
        }
        catch (error) {
            this.logger.error('Error auto-renewing licenses:', error);
        }
    }
    async sendExpirationAlerts() {
        try {
            this.logger.log('Checking for licenses expiring soon...');
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            const { data: expiringLicenses, error } = await this.supabase
                .getAdminClient()
                .from('licenses')
                .select('*, tenants(*)')
                .eq('status', 'ACTIVE')
                .lte('expires_at', sevenDaysFromNow.toISOString())
                .gt('expires_at', new Date().toISOString());
            if (error) {
                this.logger.error(`Failed to fetch expiring licenses: ${error.message}`);
                return;
            }
            for (const license of expiringLicenses || []) {
                this.logger.log(`License ${license.id} expiring on ${license.expires_at} for tenant`);
            }
            this.logger.log('Expiration alert check completed');
        }
        catch (error) {
            this.logger.error('Error sending expiration alerts:', error);
        }
    }
    async resetMonthlyUsage() {
        try {
            this.logger.log('Resetting monthly usage counters...');
            const now = new Date();
            const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
            const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
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
        }
        catch (error) {
            this.logger.error('Error resetting monthly usage:', error);
        }
    }
    async suspendExpiredTenants() {
        try {
            this.logger.log('Checking for expired tenants to suspend...');
            const { data: expiredLicenses, error } = await this.supabase
                .getAdminClient()
                .from('licenses')
                .select('tenant_id')
                .eq('status', 'EXPIRED')
                .lt('expires_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
            if (error) {
                this.logger.error(`Failed to fetch expired tenants: ${error.message}`);
                return;
            }
            const uniqueTenantIds = [...new Set((expiredLicenses || []).map(l => l.tenant_id))];
            for (const tenantId of uniqueTenantIds) {
                const { error: updateError } = await this.supabase
                    .getAdminClient()
                    .from('tenants')
                    .update({ status: 'SUSPENDED' })
                    .eq('id', tenantId);
                if (updateError) {
                    this.logger.error(`Failed to suspend tenant ${tenantId}: ${updateError.message}`);
                }
                else {
                    this.logger.log(`Suspended tenant ${tenantId} due to expired license`);
                }
            }
            this.logger.log('Tenant suspension check completed');
        }
        catch (error) {
            this.logger.error('Error suspending expired tenants:', error);
        }
    }
};
exports.LicenseScheduler = LicenseScheduler;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicenseScheduler.prototype, "handleExpiredLicenses", null);
__decorate([
    (0, schedule_1.Cron)('0 1 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicenseScheduler.prototype, "handleAutoRenewal", null);
__decorate([
    (0, schedule_1.Cron)('0 8 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicenseScheduler.prototype, "sendExpirationAlerts", null);
__decorate([
    (0, schedule_1.Cron)('0 0 1 * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicenseScheduler.prototype, "resetMonthlyUsage", null);
__decorate([
    (0, schedule_1.Cron)('0 2 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LicenseScheduler.prototype, "suspendExpiredTenants", null);
exports.LicenseScheduler = LicenseScheduler = LicenseScheduler_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licensing_service_1.LicensingService,
        supabase_service_1.SupabaseService])
], LicenseScheduler);
//# sourceMappingURL=license.scheduler.js.map