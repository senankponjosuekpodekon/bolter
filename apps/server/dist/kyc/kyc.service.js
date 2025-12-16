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
exports.KycService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const notifications_service_1 = require("../notifications/notifications.service");
let KycService = class KycService {
    constructor(supabase, notificationsService) {
        this.supabase = supabase;
        this.notificationsService = notificationsService;
    }
    async uploadDocument(userId, dto) {
        const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').insert({
            user_id: userId, document_type: dto.documentType, file_path: dto.filePath, file_size: dto.fileSize, mime_type: dto.mimeType, status: 'PENDING',
        }).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to upload document: ${error.message}`);
        await this.updateUserKycStatus(userId);
        return data;
    }
    async findByUserId(userId) {
        const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch documents: ${error.message}`);
        return data;
    }
    async findPendingDocuments() {
        const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').select('*, users:user_id(id, email, first_name, last_name)').eq('status', 'PENDING').order('created_at', { ascending: true });
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch pending documents: ${error.message}`);
        return data;
    }
    async getDocumentById(documentId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('kyc_documents')
            .select('*')
            .eq('id', documentId)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(`Failed to fetch document: ${error.message}`);
        if (!data)
            throw new common_1.NotFoundException('Document not found');
        return data;
    }
    async reviewDocument(adminId, documentId, dto) {
        const { data: document, error: fetchError } = await this.supabase.getAdminClient().from('kyc_documents').select('*').eq('id', documentId).maybeSingle();
        if (fetchError || !document)
            throw new common_1.NotFoundException('Document not found');
        if (document.status !== 'PENDING')
            throw new common_1.BadRequestException('Document has already been reviewed');
        const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
        const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').update({
            status: newStatus, reviewed_by: adminId, reviewed_at: new Date().toISOString(), rejection_reason: dto.rejectionReason || null,
        }).eq('id', documentId).select().single();
        if (error)
            throw new common_1.BadRequestException(`Failed to review document: ${error.message}`);
        await this.updateUserKycStatus(document.user_id);
        await this.notificationsService.notifyKycDocumentReviewed({
            userId: document.user_id,
            documentType: document.document_type,
            approved: dto.approved,
            rejectionReason: dto.rejectionReason ?? null,
        });
        return data;
    }
    async updateUserKycStatus(userId) {
        const { data: userRecord, error: userError } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('kyc_status')
            .eq('id', userId)
            .maybeSingle();
        if (userError) {
            throw new common_1.BadRequestException(`Failed to fetch user status: ${userError.message}`);
        }
        const previousStatus = userRecord?.kyc_status ?? null;
        const documents = await this.findByUserId(userId);
        const requiredTypes = ['ID_CARD', 'SELFIE', 'PROOF_ADDRESS'];
        const hasAllRequired = requiredTypes.every(type => documents.some(doc => doc.document_type === type));
        if (!hasAllRequired) {
            await this.supabase.getAdminClient().from('users').update({ kyc_status: 'PENDING' }).eq('id', userId);
            await this.notificationsService.notifyKycStatusChanged({
                userId,
                previousStatus,
                newStatus: 'PENDING',
            });
            return;
        }
        const hasPending = documents.some(doc => doc.status === 'PENDING');
        const hasRejected = documents.some(doc => doc.status === 'REJECTED');
        let kycStatus = 'PENDING';
        if (hasPending)
            kycStatus = 'SUBMITTED';
        else if (hasRejected)
            kycStatus = 'REJECTED';
        else
            kycStatus = 'APPROVED';
        await this.supabase.getAdminClient().from('users').update({ kyc_status: kycStatus }).eq('id', userId);
        await this.notificationsService.notifyKycStatusChanged({
            userId,
            previousStatus,
            newStatus: kycStatus,
        });
    }
};
exports.KycService = KycService;
exports.KycService = KycService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        notifications_service_1.NotificationsService])
], KycService);
//# sourceMappingURL=kyc.service.js.map