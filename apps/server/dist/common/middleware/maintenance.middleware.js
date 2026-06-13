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
exports.MaintenanceMiddleware = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../../supabase/supabase.service");
const config_1 = require("@nestjs/config");
const jwt = __importStar(require("jsonwebtoken"));
const BYPASS_PATHS = ['/api/health', '/api/auth/login', '/api/auth/refresh'];
const BYPASS_ROLES = ['SUPER_ADMIN', 'ADMIN'];
let MaintenanceMiddleware = class MaintenanceMiddleware {
    constructor(supabase, config) {
        this.supabase = supabase;
        this.config = config;
        this.enabled = false;
        this.lastChecked = 0;
        this.TTL_MS = 30_000;
    }
    async use(req, _res, next) {
        const now = Date.now();
        if (now - this.lastChecked > this.TTL_MS) {
            this.lastChecked = now;
            const { data } = await this.supabase
                .getAdminClient()
                .from('system_config')
                .select('value')
                .eq('key', 'maintenance_mode')
                .single();
            this.enabled = data?.value?.value === true;
        }
        if (!this.enabled)
            return next();
        const path = req.path;
        if (BYPASS_PATHS.some((p) => path.startsWith(p)))
            return next();
        const authHeader = req.headers['authorization'];
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.slice(7);
                const secret = this.config.get('jwt.secret');
                const decoded = jwt.verify(token, secret);
                if (decoded?.role && BYPASS_ROLES.includes(decoded.role))
                    return next();
            }
            catch {
            }
        }
        throw new common_1.ServiceUnavailableException('Platform is under maintenance. Please try again later.');
    }
};
exports.MaintenanceMiddleware = MaintenanceMiddleware;
exports.MaintenanceMiddleware = MaintenanceMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        config_1.ConfigService])
], MaintenanceMiddleware);
//# sourceMappingURL=maintenance.middleware.js.map