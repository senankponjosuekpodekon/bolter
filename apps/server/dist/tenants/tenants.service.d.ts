import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateTenantDto, UpdateTenantDto, Tenant } from './dto/create-tenant.dto';
export declare class TenantsService {
    private supabase;
    private auditLogs;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogs: AuditLogsService);
    create(dto: CreateTenantDto, createdBy: string): Promise<Tenant>;
    getById(id: string): Promise<Tenant>;
    getBySlug(slug: string): Promise<Tenant>;
    getBySubdomain(subdomain: string): Promise<Tenant>;
    getAll(limit?: number, offset?: number): Promise<Tenant[]>;
    update(id: string, dto: UpdateTenantDto, updatedBy: string): Promise<Tenant>;
    suspend(id: string, reason: string, suspendedBy: string): Promise<Tenant>;
    reactivate(id: string, reactivatedBy: string): Promise<Tenant>;
    getStatistics(tenantId: string): Promise<{
        activeUsers: number;
        totalAccounts: number;
        totalTransactions: number;
        storageUsedGB: number;
    }>;
    private createDefaultLicense;
}
