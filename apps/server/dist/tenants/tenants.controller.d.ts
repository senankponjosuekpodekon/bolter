import { TenantsService, Tenant } from './tenants.service';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    findAll(): Promise<Tenant[]>;
    findOne(id: string): Promise<Tenant>;
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
