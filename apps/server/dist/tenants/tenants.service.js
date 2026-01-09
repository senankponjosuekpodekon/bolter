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
var TenantsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
let TenantsService = TenantsService_1 = class TenantsService {
    constructor(supabase, auditLogs) {
        this.supabase = supabase;
        this.auditLogs = auditLogs;
        this.logger = new common_1.Logger(TenantsService_1.name);
    }
    async create(dto, createdBy) {
        const { data: existing, error: checkError } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('id')
            .eq('slug', dto.slug)
            .single();
        if (checkError && checkError.code !== 'PGRST116') {
            this.logger.error(`Error checking slug: ${checkError.message}`);
            throw new common_1.BadRequestException('Failed to validate tenant slug');
        }
        if (existing) {
            throw new common_1.BadRequestException(`Slug "${dto.slug}" is already taken`);
        }
        const { data: tenant, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .insert([
            {
                name: dto.name,
                slug: dto.slug,
                subdomain: dto.subdomain,
                contact_email: dto.contact_email,
                status: create_tenant_dto_1.TenantStatus.TRIAL,
            },
        ])
            .select()
            .single();
        if (error || !tenant) {
            this.logger.error(`Failed to create tenant: ${error?.message}`);
            throw new common_1.BadRequestException('Failed to create tenant');
        }
        await this.createDefaultLicense(tenant.id);
        await this.auditLogs.log({
            action: 'CREATE',
            resourceType: 'TENANT',
            resourceId: tenant.id,
            performedBy: createdBy,
            metadata: { description: `Created tenant: ${tenant.name}` },
        });
        return tenant;
    }
    async getById(id) {
        const { data: tenant, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('id', id)
            .single();
        if (error || !tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async getBySlug(slug) {
        const { data: tenant, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error || !tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async getBySubdomain(subdomain) {
        const { data: tenant, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('subdomain', subdomain)
            .single();
        if (error || !tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        return tenant;
    }
    async getAll(limit = 100, offset = 0) {
        const { data: tenants, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) {
            this.logger.error(`Failed to fetch tenants: ${error.message}`);
            return [];
        }
        return (tenants || []);
    }
    async update(id, dto, updatedBy) {
        const tenant = await this.getById(id);
        const updateData = {};
        if (dto.name)
            updateData.name = dto.name;
        if (dto.contact_email)
            updateData.contact_email = dto.contact_email;
        if (dto.status)
            updateData.status = dto.status;
        const { data: updated, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();
        if (error || !updated) {
            this.logger.error(`Failed to update tenant: ${error?.message}`);
            throw new common_1.BadRequestException('Failed to update tenant');
        }
        await this.auditLogs.log({
            action: 'UPDATE',
            resourceType: 'TENANT',
            resourceId: id,
            performedBy: updatedBy,
            metadata: { description: `Updated tenant: ${tenant.name}` },
        });
        return updated;
    }
    async suspend(id, reason, suspendedBy) {
        return this.update(id, { status: create_tenant_dto_1.TenantStatus.SUSPENDED }, suspendedBy);
    }
    async reactivate(id, reactivatedBy) {
        return this.update(id, { status: create_tenant_dto_1.TenantStatus.ACTIVE }, reactivatedBy);
    }
    async getStatistics(tenantId) {
        const { count: usersCount } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('id', { count: 'exact' })
            .eq('tenant_id', tenantId)
            .eq('status', 'ACTIVE');
        const { count: accountsCount } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .select('id', { count: 'exact' })
            .eq('tenant_id', tenantId);
        const { count: transactionsCount } = await this.supabase
            .getAdminClient()
            .from('transactions')
            .select('id', { count: 'exact' })
            .eq('tenant_id', tenantId);
        const { data: storageTracking } = await this.supabase
            .getAdminClient()
            .from('usage_tracking')
            .select('count')
            .eq('tenant_id', tenantId)
            .eq('feature', 'storage_gb')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
        return {
            activeUsers: usersCount || 0,
            totalAccounts: accountsCount || 0,
            totalTransactions: transactionsCount || 0,
            storageUsedGB: storageTracking?.count || 0,
        };
    }
    async createDefaultLicense(tenantId) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        const { error } = await this.supabase
            .getAdminClient()
            .from('licenses')
            .insert([
            {
                tenant_id: tenantId,
                tier: 'STARTER',
                expires_at: expiresAt.toISOString(),
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
                status: 'ACTIVE',
            },
        ]);
        if (error) {
            this.logger.error(`Failed to create default license: ${error.message}`);
        }
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = TenantsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map