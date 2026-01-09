import { LicensingService, LicenseTier } from './licensing.service';
export declare class LicensingController {
    private licensingService;
    constructor(licensingService: LicensingService);
    getCurrent(req: any): Promise<import("./licensing.service").License>;
    hasFeature(feature: string, req: any): Promise<{
        feature: string;
        available: boolean;
    }>;
    getAvailableFeatures(req: any): Promise<{
        modules: Record<string, boolean>;
    }>;
    getRemainingLimit(feature: string, req: any): Promise<{
        feature: string;
        remaining: number;
        currentMonth: string;
    }>;
    upgrade(body: {
        tier: LicenseTier;
    }, req: any): Promise<import("./licensing.service").License>;
    getTenantLicense(tenantId: string): Promise<import("./licensing.service").License>;
}
