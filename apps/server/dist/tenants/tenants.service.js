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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantsService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let TenantsService = class TenantsService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async findBySlug(slug) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .maybeSingle();
        if (error)
            return null;
        return data;
    }
    async findByDomain(domain) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('domain', domain)
            .eq('is_active', true)
            .maybeSingle();
        if (error)
            return null;
        return data;
    }
    async findById(id) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error || !data)
            throw new common_1.NotFoundException(`Tenant ${id} not found`);
        return data;
    }
    async findAll() {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .select('*')
            .order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch tenants: ${error.message}`);
        return (data ?? []);
    }
    async create(dto) {
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
        if (error)
            throw new common_1.BadRequestException(`Failed to create tenant: ${error.message}`);
        return data;
    }
    async update(id, dto) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .update({ ...dto, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update tenant: ${error.message}`);
        return data;
    }
    async deactivate(id) {
        const { error } = await this.supabase
            .getAdminClient()
            .from('tenants')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error)
            throw new common_1.BadRequestException(`Failed to deactivate tenant: ${error.message}`);
    }
};
exports.TenantsService = TenantsService;
exports.TenantsService = TenantsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], TenantsService);
//# sourceMappingURL=tenants.service.js.map