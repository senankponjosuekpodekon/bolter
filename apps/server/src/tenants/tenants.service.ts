import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string | null;
  logo_url?: string | null;
  primary_color?: string | null;
  support_email?: string | null;
  plan: string;
  is_active: boolean;
  config?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

@Injectable()
export class TenantsService {
  constructor(private readonly supabase: SupabaseService) {}

  async findBySlug(slug: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return null;
    return data as Tenant | null;
  }

  async findByDomain(domain: string): Promise<Tenant | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('domain', domain)
      .eq('is_active', true)
      .maybeSingle();
    if (error) return null;
    return data as Tenant | null;
  }

  async findById(id: string): Promise<Tenant> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) throw new NotFoundException(`Tenant ${id} not found`);
    return data as Tenant;
  }

  async findAll(): Promise<Tenant[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new BadRequestException(`Failed to fetch tenants: ${error.message}`);
    return (data ?? []) as Tenant[];
  }

  async create(dto: {
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
    primary_color?: string;
    support_email?: string;
    plan?: string;
  }): Promise<Tenant> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .insert({
        name: dto.name,
        slug: dto.slug,
        domain: dto.domain ?? null,
        logo_url: dto.logo_url ?? null,
        primary_color: dto.primary_color ?? '#2563eb',
        support_email: dto.support_email ?? null,
        plan: dto.plan ?? 'FREE',
        is_active: true,
      })
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to create tenant: ${error.message}`);
    return data as Tenant;
  }

  async update(id: string, dto: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to update tenant: ${error.message}`);
    return data as Tenant;
  }

  async deactivate(id: string): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('tenants')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new BadRequestException(`Failed to deactivate tenant: ${error.message}`);
  }
}
