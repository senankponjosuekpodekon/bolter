"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycModule = void 0;
const common_1 = require("@nestjs/common");
const kyc_controller_1 = require("./kyc.controller");
const kyc_service_1 = require("./kyc.service");
const kyc_storage_service_1 = require("./kyc-storage.service");
const kyc_filter_service_1 = require("./kyc-filter.service");
const supabase_module_1 = require("../supabase/supabase.module");
const notifications_module_1 = require("../notifications/notifications.module");
const upload_rate_limit_service_1 = require("../common/services/upload-rate-limit.service");
const storage_monitoring_service_1 = require("../common/services/storage-monitoring.service");
const audit_logs_module_1 = require("../audit-logs/audit-logs.module");
let KycModule = class KycModule {
};
exports.KycModule = KycModule;
exports.KycModule = KycModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, notifications_module_1.NotificationsModule, audit_logs_module_1.AuditLogsModule],
        controllers: [kyc_controller_1.KycController],
        providers: [kyc_service_1.KycService, kyc_storage_service_1.KycStorageService, kyc_filter_service_1.KycFilterService, upload_rate_limit_service_1.UploadRateLimitService, storage_monitoring_service_1.StorageMonitoringService],
        exports: [kyc_service_1.KycService, kyc_storage_service_1.KycStorageService, kyc_filter_service_1.KycFilterService],
    })
], KycModule);
//# sourceMappingURL=kyc.module.js.map