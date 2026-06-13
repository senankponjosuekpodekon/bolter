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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const query_user_dto_1 = require("./dto/query-user.dto");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    create(req, createUserDto) {
        const actor = req.user;
        const requestedRole = createUserDto.role ?? 'CLIENT';
        if (actor.role === 'ADMIN') {
            if (requestedRole === 'ADMIN' || requestedRole === 'SUPER_ADMIN') {
                throw new common_1.ForbiddenException('ADMIN can only create CLIENT or COMPLIANCE users');
            }
        }
        if (actor.role === 'SUPER_ADMIN' && requestedRole === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Cannot create another SUPER_ADMIN');
        }
        const tenantId = req.tenant?.id ?? null;
        return this.usersService.create(createUserDto, { performedBy: actor.id, tenantId });
    }
    findAll(req, query) {
        const { skip, take } = query;
        const tenantId = req.user?.role === 'SUPER_ADMIN' ? null : (req.tenant?.id ?? null);
        return this.usersService.findAll({ skip, take, tenantId });
    }
    getProfile(req) {
        return this.usersService.findById(req.user.id);
    }
    findOne(id) {
        return this.usersService.findById(id);
    }
    updateProfile(req, updateUserDto) {
        const allowed = { ...(updateUserDto ?? {}) };
        delete allowed.role;
        delete allowed.status;
        delete allowed.kyc_status;
        return this.usersService.update(req.user.id, allowed, { performedBy: req.user.id });
    }
    async update(req, id, updateUserDto) {
        const actor = req.user;
        if (updateUserDto.role && actor.role !== 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('Only SUPER_ADMIN can change user roles');
        }
        if (actor.role === 'ADMIN') {
            const target = await this.usersService.findById(id);
            if (target?.role === 'ADMIN' || target?.role === 'SUPER_ADMIN') {
                throw new common_1.ForbiddenException('ADMIN cannot modify another ADMIN or SUPER_ADMIN');
            }
        }
        return this.usersService.update(id, updateUserDto, { performedBy: actor.id });
    }
    async remove(req, id) {
        const actor = req.user;
        const target = await this.usersService.findById(id);
        if (target?.role === 'SUPER_ADMIN') {
            throw new common_1.ForbiddenException('SUPER_ADMIN accounts cannot be deleted');
        }
        if (actor.role === 'ADMIN' && target?.role === 'ADMIN') {
            throw new common_1.ForbiddenException('ADMIN cannot delete another ADMIN');
        }
        return this.usersService.remove(id, { performedBy: actor.id });
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new user (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_user_dto_1.QueryUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update current user profile' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", void 0)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, update_user_dto_1.UpdateUserDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map