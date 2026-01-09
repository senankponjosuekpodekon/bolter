import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
export declare enum LicenseTier {
    STARTER = "STARTER",
    PROFESSIONAL = "PROFESSIONAL",
    ENTERPRISE = "ENTERPRISE"
}
export interface LicenseConfig {
    tier: LicenseTier;
    modules: Record<string, boolean>;
    limits: Record<string, number>;
    price: number;
    duration_days: number;
}
export declare const LICENSE_CONFIGS: Record<LicenseTier, LicenseConfig>;
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
export declare class LicensingService {
    private supabase;
    private auditLogs;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogs: AuditLogsService);
    getActiveLicense(tenantId: string): Promise<License | null>;
    hasFeature(tenantId: string, feature: string): Promise<boolean>;
    validateFeature(tenantId: string, feature: string): Promise<void>;
    getRemainingLimit(tenantId: string, feature: string, currentMonth: string): Promise<number | -1>;
    checkRateLimit(tenantId: string, feature: string): Promise<boolean>;
    incrementUsage(tenantId: string, feature: string, amount?: number): Promise<void>;
    upgradeLicense(tenantId: string, newTier: LicenseTier, upgradedBy: string): Promise<License>;
    private recordLicenseHistory;
    autoRenewExpiredLicenses(): Promise<void>;
    markExpiredLicenses(): Promise<void>;
}
