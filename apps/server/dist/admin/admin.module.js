"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const bulk_operations_service_1 = require("./bulk-operations.service");
const bulk_operations_controller_1 = require("./bulk-operations.controller");
const audit_export_service_1 = require("./audit-export.service");
const audit_export_controller_1 = require("./audit-export.controller");
const admin_service_1 = require("./admin.service");
const admin_dashboard_controller_1 = require("./admin-dashboard.controller");
const supabase_module_1 = require("../supabase/supabase.module");
const auth_module_1 = require("../auth/auth.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [supabase_module_1.SupabaseModule, auth_module_1.AuthModule],
        controllers: [bulk_operations_controller_1.BulkOperationsController, audit_export_controller_1.AuditExportController, admin_dashboard_controller_1.AdminDashboardController],
        providers: [bulk_operations_service_1.BulkOperationsService, audit_export_service_1.AuditExportService, admin_service_1.AdminService],
        exports: [bulk_operations_service_1.BulkOperationsService, audit_export_service_1.AuditExportService, admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map