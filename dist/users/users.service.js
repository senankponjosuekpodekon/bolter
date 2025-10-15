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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const bcrypt = __importStar(require("bcrypt"));
let UsersService = class UsersService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async create(data) {
        const { password, email, firstName, lastName, role } = data;
        const hashedPassword = password ? await this.hashPassword(password) : null;
        const { data: user, error } = await this.supabase.getAdminClient().from('users').insert({
            email, password_hash: hashedPassword, first_name: firstName, last_name: lastName, role: role || 'CLIENT',
        }).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to create user: ${error.message}`);
        const accountNumber = this.generateAccountNumber();
        await this.supabase.getAdminClient().from('accounts').insert({
            user_id: user.id, account_number: accountNumber, account_type: 'CHECKING', balance: 0,
        });
        return this.mapUser(user);
    }
    async findAll(params) {
        const { skip = 0, take = 100 } = params || {};
        const { data, error } = await this.supabase.getAdminClient().from('users').select('*').range(skip, skip + take - 1);
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch users: ${error.message}`);
        return data.map(u => this.mapUser(u));
    }
    async findById(id) {
        const { data, error } = await this.supabase.getAdminClient().from('users').select('*').eq('id', id).maybeSingle();
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch user: ${error.message}`);
        return data ? this.mapUser(data) : null;
    }
    async findByEmail(email) {
        const { data, error } = await this.supabase.getAdminClient().from('users').select('*').eq('email', email).maybeSingle();
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch user: ${error.message}`);
        return data ? this.mapUser(data) : null;
    }
    async update(id, updateData) {
        const user = await this.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        const { password, ...userData } = updateData;
        const hashedPassword = password ? await this.hashPassword(password) : undefined;
        const updatePayload = {};
        if (userData.firstName)
            updatePayload.first_name = userData.firstName;
        if (userData.lastName)
            updatePayload.last_name = userData.lastName;
        if (hashedPassword)
            updatePayload.password_hash = hashedPassword;
        if (userData.role)
            updatePayload.role = userData.role;
        const { data, error } = await this.supabase.getAdminClient().from('users').update(updatePayload).eq('id', id).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to update user: ${error.message}`);
        return this.mapUser(data);
    }
    async remove(id) {
        const user = await this.findById(id);
        if (!user)
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        const { error } = await this.supabase.getAdminClient().from('users').delete().eq('id', id);
        if (error)
            throw new common_1.BadRequestException(`Failed to delete user: ${error.message}`);
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
    generateAccountNumber() {
        const countryCode = 'FR';
        const checkDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        const bankCode = '30004';
        const branchCode = '00001';
        const accountNumber = Math.floor(Math.random() * 10000000000).toString().padStart(11, '0');
        const key = Math.floor(Math.random() * 100).toString().padStart(2, '0');
        return `${countryCode}${checkDigits}${bankCode}${branchCode}${accountNumber}${key}`;
    }
    mapUser(user) {
        return {
            id: user.id, email: user.email, password: user.password_hash, firstName: user.first_name,
            lastName: user.last_name, role: user.role, status: user.status, kycStatus: user.kyc_status,
            refreshToken: user.refresh_token, createdAt: user.created_at, updatedAt: user.updated_at,
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], UsersService);
//# sourceMappingURL=users.service.js.map