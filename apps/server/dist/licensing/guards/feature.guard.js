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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureGuard = exports.RequireFeature = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const licensing_service_1 = require("../licensing.service");
const RequireFeature = (feature) => {
    return (target, key, descriptor) => {
        Reflect.defineMetadata('requireFeature', feature, descriptor?.value || target);
    };
};
exports.RequireFeature = RequireFeature;
let FeatureGuard = class FeatureGuard {
    constructor(licensingService, reflector) {
        this.licensingService = licensingService;
        this.reflector = reflector;
    }
    async canActivate(context) {
        const requiredFeature = this.reflector.get('requireFeature', context.getHandler());
        if (!requiredFeature) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const tenantId = request.user?.tenant_id;
        if (!tenantId) {
            throw new common_1.BadRequestException('No tenant associated with user');
        }
        const hasFeature = await this.licensingService.hasFeature(tenantId, requiredFeature);
        if (!hasFeature) {
            throw new common_1.BadRequestException(`Feature "${requiredFeature}" is not available for your license tier. Please upgrade to access this feature.`);
        }
        return true;
    }
};
exports.FeatureGuard = FeatureGuard;
exports.FeatureGuard = FeatureGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [licensing_service_1.LicensingService,
        core_1.Reflector])
], FeatureGuard);
//# sourceMappingURL=feature.guard.js.map