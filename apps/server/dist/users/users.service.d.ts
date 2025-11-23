export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    address?: string | null;
    role: string;
    status?: string;
    kyc_status?: string;
    hasPassword: boolean;
    createdAt?: string;
    updatedAt?: string;
    password?: string;
    refreshToken?: string;
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
        metadata?: {
            changes?: Record<string, unknown>;
            [k: string]: unknown;
        };
    }): Promise<User>;
    findAll(params?: {
        skip?: number;
        take?: number;
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
    private hashPassword;
    private mapUser;
}
