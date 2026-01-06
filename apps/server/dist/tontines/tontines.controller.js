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
exports.TontinesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tontines_service_1 = require("./tontines.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/guards/optional-jwt-auth.guard");
const pay_tontine_dto_1 = require("./dto/pay-tontine.dto");
let TontinesController = class TontinesController {
    constructor(tontinesService) {
        this.tontinesService = tontinesService;
    }
    async create(req, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.createTontine(userId, dto);
    }
    async getUserTontines(req) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getUserTontines(userId);
    }
    async getUserApplications(req) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getUserApplications(userId);
    }
    async getTontine(req, tontineId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getTontine(tontineId, userId);
    }
    async updateTontine(req, tontineId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.updateTontine(tontineId, userId, dto);
    }
    async startTontine(req, tontineId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.startTontine(tontineId, userId);
    }
    async addMember(req, tontineId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.addMember(tontineId, userId, dto);
    }
    async getMembers(req, tontineId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getMembers(tontineId, userId);
    }
    async payTontine(req, tontineId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.payTontine(tontineId, userId, dto);
    }
    async recordContribution(req, tontineId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.recordContribution(tontineId, userId, dto);
    }
    async getStatistics(req, tontineId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getTontineStatistics(tontineId, userId);
    }
    async getMemberStatistics(req, tontineId, memberId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getMemberStatistics(tontineId, memberId, userId);
    }
    async createInvitation(req, tontineId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.createInvitation(tontineId, userId, dto);
    }
    async getTontineByInviteCode(code) {
        return this.tontinesService.getTontineByInviteCode(code);
    }
    async applyToTontine(req, code, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.applyToTontine(code, userId, dto);
    }
    async getApplications(req, tontineId) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.getApplications(tontineId, userId);
    }
    async reviewApplication(req, tontineId, applicationId, dto) {
        const userId = req.user?.id;
        if (!userId)
            throw new common_1.BadRequestException('User not authenticated');
        return this.tontinesService.reviewApplication(tontineId, applicationId, userId, dto);
    }
};
exports.TontinesController = TontinesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new tontine' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all tontines for the current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getUserTontines", null);
__decorate([
    (0, common_1.Get)('user/applications/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending applications for current user' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getUserApplications", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tontine details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getTontine", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update tontine details' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "updateTontine", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    (0, swagger_1.ApiOperation)({ summary: 'Start tontine and create first cycle' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "startTontine", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Add member to tontine' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)(':id/members'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tontine members' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    (0, swagger_1.ApiOperation)({ summary: 'Pay tontine contribution as a member' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pay_tontine_dto_1.PayTontineDto]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "payTontine", null);
__decorate([
    (0, common_1.Post)(':id/contributions'),
    (0, swagger_1.ApiOperation)({ summary: 'Record a contribution payment (admin/creator only)' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "recordContribution", null);
__decorate([
    (0, common_1.Get)(':id/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tontine statistics' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getStatistics", null);
__decorate([
    (0, common_1.Get)(':id/members/:memberId/statistics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get member statistics in tontine' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    (0, swagger_1.ApiParam)({ name: 'memberId', description: 'Member ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getMemberStatistics", null);
__decorate([
    (0, common_1.Post)(':id/invitations'),
    (0, swagger_1.ApiOperation)({ summary: 'Create invitation code for tontine' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "createInvitation", null);
__decorate([
    (0, common_1.Get)('invite/:code'),
    (0, swagger_1.ApiOperation)({ summary: 'Get tontine details by invitation code' }),
    (0, swagger_1.ApiParam)({ name: 'code', description: 'Invitation code' }),
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getTontineByInviteCode", null);
__decorate([
    (0, common_1.Post)('invite/:code/apply'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply to join tontine via invitation' }),
    (0, swagger_1.ApiParam)({ name: 'code', description: 'Invitation code' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('code')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "applyToTontine", null);
__decorate([
    (0, common_1.Get)(':id/applications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get applications for tontine' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "getApplications", null);
__decorate([
    (0, common_1.Post)(':id/applications/:applicationId/review'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve or reject application' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Tontine ID' }),
    (0, swagger_1.ApiParam)({ name: 'applicationId', description: 'Application ID' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Param)('applicationId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", Promise)
], TontinesController.prototype, "reviewApplication", null);
exports.TontinesController = TontinesController = __decorate([
    (0, swagger_1.ApiTags)('tontines'),
    (0, common_1.Controller)('tontines'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tontines_service_1.TontinesService])
], TontinesController);
//# sourceMappingURL=tontines.controller.js.map