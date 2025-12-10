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
exports.KycController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const kyc_service_1 = require("./kyc.service");
const kyc_filter_service_1 = require("./kyc-filter.service");
const kyc_storage_service_1 = require("./kyc-storage.service");
const upload_kyc_document_dto_1 = require("./dto/upload-kyc-document.dto");
const review_kyc_document_dto_1 = require("./dto/review-kyc-document.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const kyc_filter_dto_1 = require("./dto/kyc-filter.dto");
let KycController = class KycController {
    constructor(kycService, kycFilterService, kycStorageService) {
        this.kycService = kycService;
        this.kycFilterService = kycFilterService;
        this.kycStorageService = kycStorageService;
    }
    uploadDocument(req, uploadDto) {
        return this.kycService.uploadDocument(req.user?.id ?? 'unknown', uploadDto);
    }
    async uploadFile(req, file, documentType) {
        const userId = req.user?.id ?? 'unknown';
        const { path } = await this.kycStorageService.uploadDocument(userId, documentType, file.originalname, file.buffer, file.mimetype);
        return this.kycService.uploadDocument(userId, {
            documentType,
            filePath: path,
            fileSize: file.size,
            mimeType: file.mimetype,
        });
    }
    getUserDocuments(req) {
        return this.kycService.findByUserId(req.user?.id ?? 'unknown');
    }
    getPendingDocuments() {
        return this.kycService.findPendingDocuments();
    }
    async viewDocument(documentId) {
        const document = await this.kycService.getDocumentById(documentId);
        const signedUrl = await this.kycStorageService.getDocumentUrl(document.file_path);
        return {
            id: document.id,
            documentType: document.document_type,
            fileName: document.file_path.split('/').pop(),
            url: signedUrl,
            uploadedAt: document.created_at,
            status: document.status,
        };
    }
    async downloadDocument(documentId, res) {
        const document = await this.kycService.getDocumentById(documentId);
        const fileBuffer = await this.kycStorageService.downloadDocument(document.file_path);
        res.setHeader('Content-Type', document.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${document.file_path.split('/').pop()}"`);
        res.send(fileBuffer);
    }
    reviewDocument(req, id, reviewDto) {
        return this.kycService.reviewDocument(req.user?.id ?? 'unknown', id, reviewDto);
    }
    filterApplications(query) {
        return this.kycFilterService.filter(query);
    }
};
exports.KycController = KycController;
__decorate([
    (0, common_1.Post)('documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload KYC document' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_kyc_document_dto_1.UploadKycDocumentDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Post)('documents/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (req, file, cb) => {
            const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error(`Invalid file type. Allowed: JPEG, PNG, PDF`), false);
            }
        }
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload KYC document file' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('documentType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('documents'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user KYC documents' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "getUserDocuments", null);
__decorate([
    (0, common_1.Get)('documents/pending'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending KYC documents (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], KycController.prototype, "getPendingDocuments", null);
__decorate([
    (0, common_1.Get)('documents/:id/view'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Get signed URL to view KYC document (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "viewDocument", null);
__decorate([
    (0, common_1.Get)('documents/:id/download'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Download KYC document (Admin only)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], KycController.prototype, "downloadDocument", null);
__decorate([
    (0, common_1.Patch)('documents/:id/review'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Review KYC document (Admin only)' }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, review_kyc_document_dto_1.ReviewKycDocumentDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "reviewDocument", null);
__decorate([
    (0, common_1.Get)('applications/filter'),
    (0, roles_decorator_1.Roles)('ADMIN', 'COMPLIANCE'),
    (0, swagger_1.ApiOperation)({ summary: 'Filter KYC applications (Admin only)' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kyc_filter_dto_1.KycFilterDto]),
    __metadata("design:returntype", void 0)
], KycController.prototype, "filterApplications", null);
exports.KycController = KycController = __decorate([
    (0, swagger_1.ApiTags)('kyc'),
    (0, common_1.Controller)('kyc'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [kyc_service_1.KycService,
        kyc_filter_service_1.KycFilterService,
        kyc_storage_service_1.KycStorageService])
], KycController);
//# sourceMappingURL=kyc.controller.js.map