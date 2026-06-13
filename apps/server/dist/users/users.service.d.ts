export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    locale?: string | null;
    currency?: string | null;
    timezone?: string | null;
    role: string;
    status?: string;
    kyc_status?: string;
    hasPassword: boolean;
    two_factor_enabled?: boolean;
    preferences?: Record<string, unknown> | null;
    createdAt?: string;
    updatedAt?: string;
    password?: string;
    refreshToken?: string;
    tenant_id?: string | null;
}
import { SupabaseService } from '../supabase/supabase.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class UsersService {
    private supabase;
    private readonly auditLogsService;
    private readonly notificationsService;
    private readonly logger;
    constructor(supabase: SupabaseService, auditLogsService: AuditLogsService, notificationsService: NotificationsService);
    create(data: CreateUserDto, options?: {
        performedBy?: string | null;
        tenantId?: string | null;
        metadata?: {
            changes?: Record<string, unknown>;
            [k: string]: unknown;
        };
    }): Promise<User>;
    findAll(params?: {
        skip?: number;
        take?: number;
        tenantId?: string | null;
    }): Promise<User[]>;
    findById(id: string, options?: {
        includeSensitive?: boolean;
    }): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    update(id: string, updateData: UpdateUserDto, options?: {
        performedBy?: string | null;
        metadata?: {
            changes?: Record<string, unknown>;
            [k: string]: unknown;
        };
    }): Promise<User>;
    remove(id: string, options?: {
        performedBy?: string | null;
    }): Promise<User>;
    setRefreshToken(userId: string, refreshToken: string): Promise<void>;
    removeRefreshToken(userId: string): Promise<void>;
    setTwoFactorSecret(userId: string, secret: string): Promise<void>;
    getTwoFactorSecret(userId: string): Promise<string | null>;
    setTempTwoFactorSecret(userId: string, secret: string): Promise<void>;
    getTempTwoFactorSecret(userId: string): Promise<string | null>;
    clearTwoFactorSecret(userId: string): Promise<void>;
    clearTempTwoFactorSecret(userId: string): Promise<void>;
    setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void>;
    findByPasswordResetToken(token: string): Promise<(User & {
        password_reset_expires?: string;
    }) | null>;
    updatePasswordAndClearResetToken(userId: string, hashedPassword: string): Promise<void>;
    private hashPassword;
    private mapUser;
}
