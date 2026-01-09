export declare enum TenantStatus {
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    TRIAL = "TRIAL",
    EXPIRED = "EXPIRED"
}
export declare class CreateTenantDto {
    name: string;
    slug: string;
    subdomain?: string;
    contact_email?: string;
}
export declare class UpdateTenantDto {
    name?: string;
    contact_email?: string;
    status?: TenantStatus;
}
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    subdomain?: string;
    contact_email?: string;
    status: TenantStatus;
    created_at: Date;
    updated_at: Date;
}
