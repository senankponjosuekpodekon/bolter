declare const USER_ROLES: readonly ["CLIENT", "ADMIN", "COMPLIANCE"];
declare const USER_STATUSES: readonly ["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "CLOSED"];
declare const KYC_STATUSES: readonly ["PENDING", "SUBMITTED", "APPROVED", "REJECTED"];
export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type UserKycStatus = (typeof KYC_STATUSES)[number];
export declare class CreateUserDto {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
    role?: UserRole;
    status?: UserStatus;
    kyc_status?: UserKycStatus;
}
export {};
