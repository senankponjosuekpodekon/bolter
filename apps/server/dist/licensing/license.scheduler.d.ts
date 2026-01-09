import { LicensingService } from './licensing.service';
import { SupabaseService } from '../supabase/supabase.service';
export declare class LicenseScheduler {
    private licensingService;
    private supabase;
    private readonly logger;
    constructor(licensingService: LicensingService, supabase: SupabaseService);
    handleExpiredLicenses(): Promise<void>;
    handleAutoRenewal(): Promise<void>;
    sendExpirationAlerts(): Promise<void>;
    resetMonthlyUsage(): Promise<void>;
    suspendExpiredTenants(): Promise<void>;
}
