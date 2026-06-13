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
exports.TenantMiddleware = void 0;
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("../../tenants/tenants.service");
const config_1 = require("@nestjs/config");
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';
let TenantMiddleware = class TenantMiddleware {
    constructor(tenantsService, config) {
        this.tenantsService = tenantsService;
        this.config = config;
    }
    async use(req, _res, next) {
        const headerTenantId = req.headers['x-tenant-id'];
        if (headerTenantId) {
            try {
                const tenant = await this.tenantsService.findById(headerTenantId);
                if (tenant?.is_active) {
                    req['tenant'] = tenant;
                    return next();
                }
            }
            catch {
            }
        }
        const host = req.hostname || '';
        const rootDomain = this.config.get('app.url')
            ? new URL(this.config.get('app.url')).hostname
            : 'localhost';
        const isSubdomain = host !== rootDomain && host !== 'localhost' && host !== '127.0.0.1';
        if (isSubdomain) {
            const slug = host.split('.')[0];
            const tenant = await this.tenantsService.findBySlug(slug);
            if (tenant) {
                req['tenant'] = tenant;
                return next();
            }
        }
        try {
            const defaultTenant = await this.tenantsService.findById(DEFAULT_TENANT_ID);
            req['tenant'] = defaultTenant;
        }
        catch {
            req['tenant'] = { id: DEFAULT_TENANT_ID, name: 'Default', slug: 'default', is_active: true, plan: 'FREE' };
        }
        next();
    }
};
exports.TenantMiddleware = TenantMiddleware;
exports.TenantMiddleware = TenantMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [tenants_service_1.TenantsService,
        config_1.ConfigService])
], TenantMiddleware);
//# sourceMappingURL=tenant.middleware.js.map