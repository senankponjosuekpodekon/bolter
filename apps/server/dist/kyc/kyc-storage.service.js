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
exports.KycStorageService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let KycStorageService = class KycStorageService {
    constructor(supabase) {
        this.supabase = supabase;
        this.BUCKET_NAME = 'kyc-documents';
        this.MAX_FILE_SIZE = 5 * 1024 * 1024;
    }
    async uploadDocument(userId, documentType, fileName, fileBuffer, mimeType) {
        if (fileBuffer.length > this.MAX_FILE_SIZE) {
            throw new common_1.BadRequestException(`File size exceeds maximum limit of 5MB. Got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`);
        }
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/pdf', 'application/pdf'];
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new common_1.BadRequestException(`Invalid file type. Allowed types: JPEG, PNG, PDF. Got ${mimeType}`);
        }
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `kyc/${userId}/${documentType}/${timestamp}-${sanitizedFileName}`;
        try {
            const { data: _uploadData, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .upload(filePath, fileBuffer, {
                contentType: mimeType,
                upsert: false,
            });
            if (error) {
                throw new common_1.BadRequestException(`Storage upload failed: ${error.message}`);
            }
            const { data: publicUrlData } = this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .getPublicUrl(filePath);
            return {
                path: filePath,
                url: publicUrlData.publicUrl,
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    async getDocumentUrl(filePath, expiresIn = 3600) {
        try {
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .createSignedUrl(filePath, expiresIn);
            if (error) {
                throw new common_1.BadRequestException(`Failed to generate URL: ${error.message}`);
            }
            return data.signedUrl;
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to generate document URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    async deleteDocument(_filePath) {
        try {
            const { error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .remove([_filePath]);
            if (error) {
                throw new common_1.BadRequestException(`Failed to delete document: ${error.message}`);
            }
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to delete document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    async downloadDocument(filePath) {
        try {
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .download(filePath);
            if (error || !data) {
                throw new common_1.BadRequestException(`Failed to download document: ${error?.message || 'No data returned'}`);
            }
            return Buffer.from(await data.arrayBuffer());
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to download document: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    }
    async fileExists(filePath) {
        try {
            const { data: _listData, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .list('kyc', { limit: 1 });
            if (error) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.KycStorageService = KycStorageService;
exports.KycStorageService = KycStorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], KycStorageService);
//# sourceMappingURL=kyc-storage.service.js.map