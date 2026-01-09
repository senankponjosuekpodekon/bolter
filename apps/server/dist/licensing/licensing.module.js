"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensingModule = void 0;
const common_1 = require("@nestjs/common");
const licensing_service_1 = require("./licensing.service");
const licensing_controller_1 = require("./licensing.controller");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
let LicensingModule = class LicensingModule {
};
exports.LicensingModule = LicensingModule;
exports.LicensingModule = LicensingModule = __decorate([
    (0, common_1.Module)({
        controllers: [licensing_controller_1.LicensingController],
        providers: [licensing_service_1.LicensingService, supabase_service_1.SupabaseService, audit_logs_service_1.AuditLogsService],
        exports: [licensing_service_1.LicensingService],
    })
], LicensingModule);
//# sourceMappingURL=licensing.module.js.map