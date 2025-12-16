"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvatarModule = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const avatar_controller_1 = require("./avatar.controller");
const avatar_service_1 = require("./avatar.service");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_module_1 = require("../audit-logs/audit-logs.module");
const upload_rate_limit_service_1 = require("../common/services/upload-rate-limit.service");
const storage_monitoring_service_1 = require("../common/services/storage-monitoring.service");
let AvatarModule = class AvatarModule {
};
exports.AvatarModule = AvatarModule;
exports.AvatarModule = AvatarModule = __decorate([
    (0, common_1.Module)({
        imports: [
            audit_logs_module_1.AuditLogsModule,
            throttler_1.ThrottlerModule.forRoot([
                {
                    name: 'avatar',
                    ttl: 60_000,
                    limit: 50,
                },
            ]),
        ],
        controllers: [avatar_controller_1.AvatarController],
        providers: [
            avatar_service_1.AvatarService,
            supabase_service_1.SupabaseService,
            upload_rate_limit_service_1.UploadRateLimitService,
            storage_monitoring_service_1.StorageMonitoringService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
        exports: [avatar_service_1.AvatarService],
    })
], AvatarModule);
//# sourceMappingURL=avatar.module.js.map