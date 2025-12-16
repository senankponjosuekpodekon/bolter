"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("./auth.service");
const auth_controller_1 = require("./auth.controller");
const activity_log_service_1 = require("./activity-log.service");
const rate_limit_service_1 = require("./rate-limit.service");
const session_service_1 = require("./session.service");
const backup_codes_service_1 = require("./backup-codes.service");
const otp_service_1 = require("./otp.service");
const users_module_1 = require("../users/users.module");
const supabase_module_1 = require("../supabase/supabase.module");
const notifications_module_1 = require("../notifications/notifications.module");
const jwt_strategy_1 = require("./strategies/jwt.strategy");
const local_strategy_1 = require("./strategies/local.strategy");
const google_strategy_1 = require("./strategies/google.strategy");
const jwt_refresh_strategy_1 = require("./strategies/jwt-refresh.strategy");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            supabase_module_1.SupabaseModule,
            notifications_module_1.NotificationsModule,
            passport_1.PassportModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('jwt.secret'),
                    signOptions: {
                        expiresIn: `${config.get('jwt.expiresIn')}s`,
                    },
                }),
            }),
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            activity_log_service_1.ActivityLogService,
            rate_limit_service_1.RateLimitService,
            session_service_1.SessionService,
            backup_codes_service_1.BackupCodesService,
            otp_service_1.OtpService,
            local_strategy_1.LocalStrategy,
            jwt_strategy_1.JwtStrategy,
            jwt_refresh_strategy_1.JwtRefreshStrategy,
            google_strategy_1.GoogleStrategy,
        ],
        exports: [auth_service_1.AuthService, activity_log_service_1.ActivityLogService, rate_limit_service_1.RateLimitService, session_service_1.SessionService, backup_codes_service_1.BackupCodesService, otp_service_1.OtpService],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map