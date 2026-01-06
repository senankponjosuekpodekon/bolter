import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { CreateTenantDto, UpdateTenantDto, Tenant, TenantStatus } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private supabase: SupabaseService,
    private auditLogs: AuditLogsService,
  ) {}

  /**
   * Create a new tenant
   */
  async create(dto: CreateTenantDto, createdBy: string): Promise<Tenant> {
    // Validate slug uniqueness
    const { data: existing, error: checkError } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('id')
      .eq('slug', dto.slug)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      this.logger.error(`Error checking slug: ${checkError.message}`);
      throw new BadRequestException('Failed to validate tenant slug');
    }

    if (existing) {
      throw new BadRequestException(`Slug "${dto.slug}" is already taken`);
    }

    // Create tenant
    const { data: tenant, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .insert([
        {
          name: dto.name,
          slug: dto.slug,
          subdomain: dto.subdomain,
          contact_email: dto.contact_email,
          status: TenantStatus.TRIAL,
        },
      ])
      .select()
      .single();

    if (error || !tenant) {
      this.logger.error(`Failed to create tenant: ${error?.message}`);
      throw new BadRequestException('Failed to create tenant');
    }

    // Create default STARTER license
    await this.createDefaultLicense(tenant.id);

    // Audit log
    await this.auditLogs.log({
      action: 'CREATE',
      resourceType: 'TENANT',
      resourceId: tenant.id,
      performedBy: createdBy,
      metadata: { description: `Created tenant: ${tenant.name}` },
    });

    return tenant as Tenant;
  }

  /**
   * Get tenant by ID
   */
  async getById(id: string): Promise<Tenant> {
    const { data: tenant, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant as Tenant;
  }

  /**
   * Get tenant by slug
   */
  async getBySlug(slug: string): Promise<Tenant> {
    const { data: tenant, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant as Tenant;
  }

  /**
   * Get tenant by subdomain
   */
  async getBySubdomain(subdomain: string): Promise<Tenant> {
    const { data: tenant, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('subdomain', subdomain)
      .single();

    if (error || !tenant) {
      throw new NotFoundException('Tenant not found');
    }

    return tenant as Tenant;
  }

  /**
   * Get all tenants (admin only)
   */
  async getAll(limit = 100, offset = 0): Promise<Tenant[]> {
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

    return (tenants || []) as Tenant[];
  }

  /**
   * Update tenant
   */
  async update(id: string, dto: UpdateTenantDto, updatedBy: string): Promise<Tenant> {
    const tenant = await this.getById(id);

    const updateData: Record<string, unknown> = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.contact_email) updateData.contact_email = dto.contact_email;
    if (dto.status) updateData.status = dto.status;

    const { data: updated, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      this.logger.error(`Failed to update tenant: ${error?.message}`);
      throw new BadRequestException('Failed to update tenant');
    }

    // Audit log
    await this.auditLogs.log({
      action: 'UPDATE',
      resourceType: 'TENANT',
      resourceId: id,
      performedBy: updatedBy,
      metadata: { description: `Updated tenant: ${tenant.name}` },
    });

    return updated as Tenant;
  }

  /**
   * Suspend tenant (prevent access)
   */
  async suspend(id: string, reason: string, suspendedBy: string): Promise<Tenant> {
    return this.update(id, { status: TenantStatus.SUSPENDED }, suspendedBy);
  }

  /**
   * Reactivate suspended tenant
   */
  async reactivate(id: string, reactivatedBy: string): Promise<Tenant> {
    return this.update(id, { status: TenantStatus.ACTIVE }, reactivatedBy);
  }

  /**
   * Get tenant statistics
   */
  async getStatistics(tenantId: string): Promise<{
    activeUsers: number;
    totalAccounts: number;
    totalTransactions: number;
    storageUsedGB: number;
  }> {
    // Count active users
    const { count: usersCount } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'ACTIVE');

    // Count accounts
    const { count: accountsCount } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Count transactions
    const { count: transactionsCount } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Get storage usage from tracking
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

  /**
   * Create default STARTER license for new tenant
   */
  private async createDefaultLicense(tenantId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days trial

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
}
