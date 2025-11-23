"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UsersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const bcrypt = __importStar(require("bcrypt"));
const account_number_util_1 = require("../common/utils/account-number.util");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let UsersService = UsersService_1 = class UsersService {
    constructor(supabase, auditLogsService, notificationsService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(UsersService_1.name);
    }
    async create(data, options) {
        const { password, email, firstName, lastName, role, phone, address, status, kyc_status } = data;
        const hashedPassword = password ? await this.hashPassword(password) : null;
        const insertPayload = {
            email,
            password_hash: hashedPassword,
            first_name: firstName || null,
            last_name: lastName || null,
            role: role || 'CLIENT',
            phone: phone || null,
            address: address || null,
        };
        if (status)
            insertPayload.status = status;
        if (kyc_status)
            insertPayload.kyc_status = kyc_status;
        const { data: user, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .insert(insertPayload)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create user: ${error.message}`);
        const accountNumber = (0, account_number_util_1.generateFrenchIban)();
        const { data: account, error: accountError } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .insert({
            user_id: user.id,
            account_number: accountNumber,
            account_type: 'CHECKING',
            balance: 0,
        })
            .select()
            .single();
        if (accountError) {
            throw new common_1.BadRequestException(`Failed to create default account: ${accountError.message}`);
        }
        const performedBy = options?.performedBy ?? user.id;
        const action = options?.performedBy && options.performedBy !== user.id ? 'USER_CREATED' : 'USER_REGISTERED';
        const baseMetadata = {
            changes: {
                email,
                role: insertPayload.role,
                status: insertPayload.status ?? null,
            },
        };
        await this.auditLogsService.log({
            userId: user.id,
            performedBy,
            action,
            resourceType: 'user',
            resourceId: user.id,
            metadata: options?.metadata ? { ...baseMetadata, ...options.metadata } : baseMetadata,
        });
        await this.auditLogsService.log({
            userId: user.id,
            performedBy,
            action: 'ACCOUNT_CREATED',
            resourceType: 'account',
            resourceId: account.id,
            metadata: {
                changes: {
                    accountType: 'CHECKING',
                    accountNumber,
                },
            },
        });
        await this.notificationsService.notifyAccountCreated(user.id, accountNumber);
        return this.mapUser(user);
    }
    async findAll(params) {
        const { skip = 0, take = 100 } = params || {};
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('*')
            .range(skip, skip + take - 1);
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch users: ${error.message}`);
        return (data ?? []).map(u => this.mapUser(u));
    }
    async findById(id, options = {}) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch user: ${error.message}`);
        return data ? this.mapUser(data, options) : null;
    }
    async findByEmail(email) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('*')
            .eq('email', email)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch user: ${error.message}`);
        return data ? this.mapUser(data, { includeSensitive: true }) : null;
    }
    async update(id, updateData, options) {
        const user = await this.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        const { password, ...userData } = updateData;
        const hashedPassword = password ? await this.hashPassword(password) : undefined;
        const updatePayload = {};
        if (userData.firstName !== undefined)
            updatePayload.first_name = userData.firstName || null;
        if (userData.lastName !== undefined)
            updatePayload.last_name = userData.lastName || null;
        if (userData.phone !== undefined)
            updatePayload.phone = userData.phone || null;
        if (userData.address !== undefined)
            updatePayload.address = userData.address || null;
        if (userData.status !== undefined)
            updatePayload.status = userData.status;
        if (userData.kyc_status !== undefined)
            updatePayload.kyc_status = userData.kyc_status;
        if (userData.role !== undefined)
            updatePayload.role = userData.role;
        if (hashedPassword)
            updatePayload.password_hash = hashedPassword;
        if (Object.keys(updatePayload).length === 0) {
            return user;
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .update(updatePayload)
            .eq('id', id)
            .select()
            .single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update user: ${error.message}`);
        const updatedUser = this.mapUser(data);
        const performedBy = options?.performedBy ?? id;
        if (Object.keys(updatePayload).length) {
            await this.auditLogsService.log({
                userId: id,
                performedBy,
                action: 'USER_UPDATED',
                resourceType: 'user',
                resourceId: id,
                metadata: options?.metadata
                    ? { ...options.metadata, changes: { ...(options.metadata?.changes ?? {}), ...updatePayload } }
                    : { changes: updatePayload },
            });
        }
        return updatedUser;
    }
    async remove(id, options) {
        const user = await this.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        const { error } = await this.supabase.getAdminClient().from('users').delete().eq('id', id);
        if (error)
            throw new common_1.BadRequestException(`Failed to delete user: ${error.message}`);
        const performedBy = options?.performedBy ?? id;
        await this.auditLogsService.log({
            userId: id,
            performedBy,
            action: 'USER_DELETED',
            resourceType: 'user',
            resourceId: id,
        });
        return user;
    }
    async setRefreshToken(userId, refreshToken) {
        await this.supabase.getAdminClient().from('users').update({ refresh_token: refreshToken }).eq('id', userId);
    }
    async removeRefreshToken(userId) {
        await this.supabase.getAdminClient().from('users').update({ refresh_token: null }).eq('id', userId);
    }
    async hashPassword(password) {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
    mapUser(user, options = {}) {
        const payload = {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            address: user.address,
            role: user.role,
            status: user.status,
            kyc_status: user.kyc_status,
            hasPassword: Boolean(user.password_hash),
            createdAt: user.created_at,
            updatedAt: user.updated_at,
        };
        if (options.includeSensitive) {
            payload.password = user.password_hash;
            payload.refreshToken = user.refresh_token;
        }
        return payload;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = UsersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], UsersService);
//# sourceMappingURL=users.service.js.map