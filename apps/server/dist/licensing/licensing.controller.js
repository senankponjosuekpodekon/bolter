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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicensingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const licensing_service_1 = require("./licensing.service");
let LicensingController = class LicensingController {
    constructor(licensingService) {
        this.licensingService = licensingService;
    }
    async getCurrent(req) {
        const tenantId = req.user.tenant_id;
        if (!tenantId) {
            throw new Error('No tenant associated with user');
        }
        return this.licensingService.getActiveLicense(tenantId);
    }
    async hasFeature(feature, req) {
        const tenantId = req.user.tenant_id;
        if (!tenantId) {
            throw new Error('No tenant associated with user');
        }
        const available = await this.licensingService.hasFeature(tenantId, feature);
        return { feature, available };
    }
    async getAvailableFeatures(req) {
        const tenantId = req.user.tenant_id;
        if (!tenantId) {
            throw new Error('No tenant associated with user');
        }
        const license = await this.licensingService.getActiveLicense(tenantId);
        if (!license) {
            return { modules: {} };
        }
        return { modules: license.modules };
    }
    async getRemainingLimit(feature, req) {
        const tenantId = req.user.tenant_id;
        if (!tenantId) {
            throw new Error('No tenant associated with user');
        }
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const remaining = await this.licensingService.getRemainingLimit(tenantId, feature, currentMonth);
        return { feature, remaining, currentMonth };
    }
    async upgrade(body, req) {
        const tenantId = req.user.tenant_id;
        if (!tenantId) {
            throw new Error('No tenant associated with user');
        }
        return this.licensingService.upgradeLicense(tenantId, body.tier, req.user.id);
    }
    async getTenantLicense(tenantId) {
        return this.licensingService.getActiveLicense(tenantId);
    }
};
exports.LicensingController = LicensingController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current license' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "getCurrent", null);
__decorate([
    (0, common_1.Get)('features/:feature'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if feature is available' }),
    __param(0, (0, common_1.Param)('feature')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "hasFeature", null);
__decorate([
    (0, common_1.Get)('available-features'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available features' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "getAvailableFeatures", null);
__decorate([
    (0, common_1.Get)('limits/:feature'),
    (0, swagger_1.ApiOperation)({ summary: 'Get remaining limit for feature' }),
    __param(0, (0, common_1.Param)('feature')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "getRemainingLimit", null);
__decorate([
    (0, common_1.Put)('upgrade'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Upgrade license to new tier' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "upgrade", null);
__decorate([
    (0, common_1.Get)('tenant/:tenantId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get license for specific tenant (admin)' }),
    __param(0, (0, common_1.Param)('tenantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LicensingController.prototype, "getTenantLicense", null);
exports.LicensingController = LicensingController = __decorate([
    (0, swagger_1.ApiTags)('Licensing'),
    (0, common_1.Controller)('licensing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [licensing_service_1.LicensingService])
], LicensingController);
//# sourceMappingURL=licensing.controller.js.map