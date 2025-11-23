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
const users_service_1 = require("../users/users.service");
const logger_service_1 = require("../common/logger/logger.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, logger, auditLogsService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = logger;
        this.auditLogsService = auditLogsService;
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
        const payload = { email: user.email, sub: user.id, role: user.role };
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
        return {
            accessToken: this.jwtService.sign(payload),
            refreshToken,
            user: this.stripSensitiveFields(user),
        };
    }
    async register(registerDto) {
        const existingUser = await this.usersService.findByEmail(registerDto.email);
        if (existingUser) {
            throw new common_1.BadRequestException('User with this email already exists');
        }
        const user = await this.usersService.create({
            ...registerDto,
            role: 'CLIENT',
        }, {
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
    async validateOAuthUser(profile) {
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
            secret: this.configService.get('jwt.secret'),
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        logger_service_1.Logger,
        audit_logs_service_1.AuditLogsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map