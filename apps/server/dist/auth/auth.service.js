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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const speakeasy = __importStar(require("speakeasy"));
const qrcode = __importStar(require("qrcode"));
const users_service_1 = require("../users/users.service");
const logger_service_1 = require("../common/logger/logger.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, logger, auditLogsService, notificationsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = logger;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.auditLogger = new common_1.Logger('AuthAudit');
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!user || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const copy = { ...user };
        delete copy.password;
        delete copy.refreshToken;
        return copy;
    }
    async login(user) {
        const payload = { email: user.email, sub: user.id, role: user.role, tenant_id: user.tenant_id ?? null };
        const refreshToken = this.generateRefreshToken(payload);
        await this.usersService.setRefreshToken(user.id, refreshToken);
        const success = await this.auditLogsService.log({
            userId: user.id,
            performedBy: user.id,
            action: 'AUTH_LOGIN',
            resourceType: 'auth',
            resourceId: user.id,
            metadata: {
                method: 'PASSWORD',
            },
        });
        if (!success) {
            this.auditLogger.warn(`Failed to persist login audit log for ${user.email}`);
        }
        const twoFactorEnabled = user.two_factor_enabled === true;
        const response = {
            accessToken: this.jwtService.sign(payload),
            refreshToken,
            user: this.stripSensitiveFields(user),
            requires2FA: twoFactorEnabled,
        };
        return response;
    }
    async register(registerDto, tenantId) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const user = await this.usersService.create({
            ...registerDto,
            role: 'CLIENT',
        }, {
            tenantId: tenantId ?? null,
            metadata: {
                channel: 'EMAIL',
            },
        });
        this.logger.log(`New user registered: ${user.email}`, 'AuthService');
        return this.login(user);
    }
    async refreshToken(userId, refreshToken) {
        const user = await this.usersService.findById(userId, { includeSensitive: true });
        if (!user || user.refreshToken !== refreshToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const payload = { email: user.email, sub: user.id, role: user.role };
        const response = {
            accessToken: this.jwtService.sign(payload),
        };
        const success = await this.auditLogsService.log({
            userId: user.id,
            performedBy: user.id,
            action: 'AUTH_REFRESH',
            resourceType: 'auth',
            resourceId: user.id,
        });
        if (!success) {
            this.auditLogger.warn(`Failed to persist token refresh audit log for ${user.email}`);
        }
        return response;
    }
    async validateOAuthUser(profile, tenantId) {
        const { emails, displayName } = profile;
        const email = emails[0].value;
        let user = await this.usersService.findByEmail(email);
        if (!user) {
            const names = displayName.split(' ');
            const firstName = names[0];
            const lastName = names.length > 1 ? names[names.length - 1] : '';
            user = await this.usersService.create({
                email,
                password: '',
                firstName,
                lastName,
                role: 'CLIENT',
            }, {
                tenantId: tenantId ?? null,
                metadata: {
                    channel: 'GOOGLE',
                },
            });
            this.logger.log(`New user registered via Google: ${email}`, 'AuthService');
        }
        const success = await this.auditLogsService.log({
            userId: user.id,
            performedBy: user.id,
            action: 'AUTH_LOGIN',
            resourceType: 'auth',
            resourceId: user.id,
            metadata: {
                method: 'GOOGLE',
            },
        });
        if (!success) {
            this.auditLogger.warn(`Failed to persist Google login audit log for ${email}`);
        }
        return this.stripSensitiveFields(user);
    }
    generateRefreshToken(payload) {
        const refreshToken = this.jwtService.sign(payload, {
            secret: this.configService.get('jwt.refreshSecret'),
            expiresIn: `${this.configService.get('jwt.refreshExpiresIn')}s`,
        });
        return refreshToken;
    }
    async logout(userId) {
        await this.usersService.removeRefreshToken(userId);
        await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: 'AUTH_LOGOUT',
            resourceType: 'auth',
            resourceId: userId,
        });
        return { success: true };
    }
    stripSensitiveFields(user) {
        if (!user)
            return null;
        const copy = { ...user };
        delete copy.password;
        delete copy.refreshToken;
        return copy;
    }
    async setupTwoFactor(userId) {
        const user = await this.usersService.findById(userId);
        const appName = this.configService.get('app.name') || 'Bolter Banking';
        const secret = speakeasy.generateSecret({
            name: `${appName} (${user?.email || 'user'})`,
            issuer: appName,
        });
        await this.usersService.setTempTwoFactorSecret(userId, secret.base32);
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);
        return {
            secret: secret.base32,
            qrCodeUrl
        };
    }
    async enableTwoFactor(userId, token) {
        const already = await this.usersService.getTwoFactorSecret(userId);
        if (already) {
            throw new common_1.BadRequestException('2FA is already enabled');
        }
        const tempSecret = await this.usersService.getTempTwoFactorSecret(userId);
        if (!tempSecret) {
            throw new common_1.BadRequestException('No pending 2FA setup found. Please start setup first.');
        }
        const verified = speakeasy.totp.verify({
            secret: tempSecret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!verified) {
            throw new common_1.BadRequestException('Invalid 2FA token');
        }
        await this.usersService.setTwoFactorSecret(userId, tempSecret);
        await this.usersService.clearTempTwoFactorSecret(userId);
        await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: '2FA_ENABLED',
            resourceType: 'auth',
            resourceId: userId,
        });
        return { success: true, message: '2FA enabled successfully' };
    }
    async disableTwoFactor(userId, token) {
        const secret = await this.usersService.getTwoFactorSecret(userId);
        if (!secret) {
            throw new common_1.BadRequestException('2FA is not enabled');
        }
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!verified) {
            throw new common_1.BadRequestException('Invalid 2FA token');
        }
        await this.usersService.clearTwoFactorSecret(userId);
        await this.auditLogsService.log({
            userId,
            performedBy: userId,
            action: '2FA_DISABLED',
            resourceType: 'auth',
            resourceId: userId,
        });
        return { success: true, message: '2FA disabled successfully' };
    }
    async verifyTwoFactor(userId, token) {
        const secret = await this.usersService.getTwoFactorSecret(userId);
        if (!secret) {
            throw new common_1.BadRequestException('2FA is not enabled');
        }
        const verified = speakeasy.totp.verify({
            secret,
            encoding: 'base32',
            token,
            window: 2,
        });
        if (!verified) {
            await this.auditLogsService.log({
                userId,
                performedBy: userId,
                action: '2FA_VERIFY_FAILED',
                resourceType: 'auth',
                resourceId: userId,
            });
            return false;
        }
        return true;
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            this.logger.warn(`Password reset requested for non-existent email: ${email}`, 'AuthService');
            return { message: 'If the email exists, a reset link has been sent' };
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await this.usersService.setPasswordResetToken(user.id, resetToken, expiresAt);
        const resetUrl = `${this.configService.get('frontend.url', 'http://localhost:5173')}/reset-password?token=${resetToken}`;
        await this.auditLogsService.log({
            userId: user.id,
            performedBy: user.id,
            action: 'PASSWORD_RESET_REQUESTED',
            resourceType: 'auth',
            resourceId: user.id,
            metadata: { email },
        });
        await this.notificationsService.notifyPasswordReset({
            userId: user.id,
            resetUrl,
        });
        this.logger.log(`Password reset requested for ${email}. Reset link sent via email.`, 'AuthService');
        return { message: 'If the email exists, a reset link has been sent' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.usersService.findByPasswordResetToken(token);
        if (!user) {
            throw new common_1.BadRequestException('Invalid or expired reset token');
        }
        if (user.password_reset_expires && new Date(user.password_reset_expires) < new Date()) {
            throw new common_1.BadRequestException('Reset token has expired');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.usersService.updatePasswordAndClearResetToken(user.id, hashedPassword);
        await this.usersService.removeRefreshToken(user.id);
        await this.auditLogsService.log({
            userId: user.id,
            performedBy: user.id,
            action: 'PASSWORD_RESET_COMPLETED',
            resourceType: 'auth',
            resourceId: user.id,
        });
        this.logger.log(`Password reset completed for user ${user.email}`, 'AuthService');
        return { message: 'Password reset successful' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        logger_service_1.Logger,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map