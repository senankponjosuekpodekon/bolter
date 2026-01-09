import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';
export declare class TenantsController {
    private tenantsService;
    constructor(tenantsService: TenantsService);
    create(dto: CreateTenantDto, req: any): Promise<import("./dto/create-tenant.dto").Tenant>;
    getCurrent(req: any): Promise<import("./dto/create-tenant.dto").Tenant>;
    getById(id: string): Promise<import("./dto/create-tenant.dto").Tenant>;
    getBySlug(slug: string): Promise<import("./dto/create-tenant.dto").Tenant>;
    getAll(): Promise<import("./dto/create-tenant.dto").Tenant[]>;
    update(id: string, dto: UpdateTenantDto, req: any): Promise<import("./dto/create-tenant.dto").Tenant>;
    getStatistics(id: string): Promise<{
        activeUsers: number;
        totalAccounts: number;
        totalTransactions: number;
        storageUsedGB: number;
    }>;
    suspend(id: string, body: {
        reason: string;
    }, req: any): Promise<import("./dto/create-tenant.dto").Tenant>;
    reactivate(id: string, req: any): Promise<import("./dto/create-tenant.dto").Tenant>;
}
