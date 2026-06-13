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
export declare class TenantsService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    findBySlug(slug: string): Promise<Tenant | null>;
    findByDomain(domain: string): Promise<Tenant | null>;
    findById(id: string): Promise<Tenant>;
    findAll(): Promise<Tenant[]>;
    create(dto: {
        name: string;
        slug: string;
        domain?: string;
        logo_url?: string;
        primary_color?: string;
        support_email?: string;
        plan?: string;
    }): Promise<Tenant>;
    update(id: string, dto: Partial<Tenant>): Promise<Tenant>;
    deactivate(id: string): Promise<void>;
}
