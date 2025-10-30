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
        metadata?: Record<string, any>;
    }): Promise<any>;
    findAll(params?: {
        skip?: number;
        take?: number;
    }): Promise<any[]>;
    findById(id: string, options?: {
        includeSensitive?: boolean;
    }): Promise<any | null>;
    findByEmail(email: string): Promise<any | null>;
    update(id: string, updateData: UpdateUserDto, options?: {
        performedBy?: string | null;
        metadata?: Record<string, any>;
    }): Promise<any>;
    remove(id: string, options?: {
        performedBy?: string | null;
    }): Promise<any>;
    setRefreshToken(userId: string, refreshToken: string): Promise<void>;
    removeRefreshToken(userId: string): Promise<void>;
    private hashPassword;
    private mapUser;
}
