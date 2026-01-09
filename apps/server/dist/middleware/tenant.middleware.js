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
var TenantMiddleware_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("../tenants/tenants.service");
let TenantMiddleware = TenantMiddleware_1 = class TenantMiddleware {
    constructor(tenantsService) {
        this.tenantsService = tenantsService;
        this.logger = new common_1.Logger(TenantMiddleware_1.name);
    }
    async use(req, res, next) {
        let tenantId;
        let tenantSlug;
        try {
            const host = req.headers.host || '';
            const parts = host.split('.');
            if (parts.length > 2) {
                const potentialSubdomain = parts[0];
                if (potentialSubdomain !== 'api' && potentialSubdomain !== 'www') {
                    tenantSlug = potentialSubdomain;
                }
            }
            const tenantIdHeader = req.headers['x-tenant-id'];
            if (tenantIdHeader) {
                tenantId = tenantIdHeader;
            }
            const tenantSlugHeader = req.headers['x-tenant-slug'];
            if (tenantSlugHeader && !tenantSlug) {
                tenantSlug = tenantSlugHeader;
            }
            if (tenantSlug && !tenantId) {
                try {
                    const tenant = await this.tenantsService.getBySlug(tenantSlug);
                    tenantId = tenant.id;
                }
                catch {
                    this.logger.warn(`Failed to resolve tenant slug: ${tenantSlug}`);
                }
            }
            req.tenantId = tenantId;
            req.tenantSlug = tenantSlug;
            this.logger.debug(`Tenant detected: ID=${tenantId}, Slug=${tenantSlug}`);
        }
        catch (error) {
            this.logger.error(`Error in tenant middleware: ${error}`);
        }
        next();
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = TenantMiddleware_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService])
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map