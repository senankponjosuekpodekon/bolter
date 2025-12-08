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
var BackupCodesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupCodesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const supabase_service_1 = require("../supabase/supabase.service");
const logger_service_1 = require("../common/logger/logger.service");
let BackupCodesService = BackupCodesService_1 = class BackupCodesService {
    constructor(supabase, logger) {
        this.supabase = supabase;
        this.logger = logger;
        this.CODE_LENGTH = 8;
        this.CODE_COUNT = 10;
    }
    async generateBackupCodes(userId) {
        await this.supabase
            .getAdminClient()
            .from('backup_codes')
            .delete()
            .eq('user_id', userId)
            .is('used_at', null);
        const codes = [];
        const hashes = [];
        for (let i = 0; i < this.CODE_COUNT; i++) {
            const code = this.generateCode();
            const hash = this.hashCode(code);
            codes.push(code);
            hashes.push(hash);
        }
        const entries = hashes.map((hash) => ({
            user_id: userId,
            code_hash: hash,
        }));
        const { error } = await this.supabase
            .getAdminClient()
            .from('backup_codes')
            .insert(entries);
        if (error) {
            this.logger.error(`Failed to save backup codes: ${error.message}`, undefined, BackupCodesService_1.name);
            throw new Error('Failed to generate backup codes');
        }
        await this.supabase
            .getAdminClient()
            .from('users')
            .update({ backup_codes_generated_at: new Date().toISOString() })
            .eq('id', userId);
        return codes;
    }
    async verifyBackupCode(userId, code) {
        const hash = this.hashCode(code);
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('backup_codes')
            .select('*')
            .eq('user_id', userId)
            .eq('code_hash', hash)
            .is('used_at', null)
            .maybeSingle();
        if (error || !data) {
            return false;
        }
        const { error: updateError } = await this.supabase
            .getAdminClient()
            .from('backup_codes')
            .update({ used_at: new Date().toISOString() })
            .eq('id', data.id);
        if (updateError) {
            this.logger.error(`Failed to mark backup code as used: ${updateError.message}`, undefined, BackupCodesService_1.name);
            return false;
        }
        this.logger.log(`Backup code used for user ${userId}`, BackupCodesService_1.name);
        return true;
    }
    async getRemainingCodesCount(userId) {
        const { count, error } = await this.supabase
            .getAdminClient()
            .from('backup_codes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('used_at', null);
        if (error) {
            this.logger.error(`Failed to get remaining codes count: ${error.message}`, undefined, BackupCodesService_1.name);
            return 0;
        }
        return count || 0;
    }
    async hasBackupCodes(userId) {
        const count = await this.getRemainingCodesCount(userId);
        return count > 0;
    }
    generateCode() {
        const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
        let code = '';
        const bytes = (0, crypto_1.randomBytes)(this.CODE_LENGTH);
        for (let i = 0; i < this.CODE_LENGTH; i++) {
            code += chars[bytes[i] % chars.length];
        }
        return `${code.slice(0, 4)}-${code.slice(4)}`;
    }
    hashCode(code) {
        const cleanCode = code.replace(/-/g, '');
        return (0, crypto_1.createHash)('sha256').update(cleanCode).digest('hex');
    }
};
exports.BackupCodesService = BackupCodesService;
exports.BackupCodesService = BackupCodesService = BackupCodesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        logger_service_1.Logger])
], BackupCodesService);
//# sourceMappingURL=backup-codes.service.js.map