import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class KycService {
  constructor(
    private supabase: SupabaseService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async uploadDocument(userId: string, dto: UploadKycDocumentDto) {
    const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').insert({
      user_id: userId, document_type: dto.documentType, file_path: dto.filePath, file_size: dto.fileSize, mime_type: dto.mimeType, status: 'PENDING',
    }).select().single();
    if (error) throw new BadRequestException(`Failed to upload document: ${error.message}`);
    await this.updateUserKycStatus(userId);
    return data;
  }

  async findByUserId(userId: string) {
    const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    if (error) throw new BadRequestException(`Failed to fetch documents: ${error.message}`);
    return data;
  }

  async findPendingDocuments() {
    const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').select('*, users:user_id(id, email, first_name, last_name)').eq('status', 'PENDING').order('created_at', { ascending: true });
    if (error) throw new BadRequestException(`Failed to fetch pending documents: ${error.message}`);
    return data;
  }

  async reviewDocument(adminId: string, documentId: string, dto: ReviewKycDocumentDto) {
    const { data: document, error: fetchError } = await this.supabase.getAdminClient().from('kyc_documents').select('*').eq('id', documentId).maybeSingle();
    if (fetchError || !document) throw new NotFoundException('Document not found');
    if (document.status !== 'PENDING') throw new BadRequestException('Document has already been reviewed');

    const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
    const { data, error } = await this.supabase.getAdminClient().from('kyc_documents').update({
      status: newStatus, reviewed_by: adminId, reviewed_at: new Date().toISOString(), rejection_reason: dto.rejectionReason || null,
    }).eq('id', documentId).select().single();

    if (error) throw new BadRequestException(`Failed to review document: ${error.message}`);
    await this.updateUserKycStatus(document.user_id);

    await this.notificationsService.notifyKycDocumentReviewed({
      userId: document.user_id,
      documentType: document.document_type,
      approved: dto.approved,
      rejectionReason: dto.rejectionReason ?? null,
    });
    return data;
  }

  private async updateUserKycStatus(userId: string) {
    const { data: userRecord, error: userError } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('kyc_status')
      .eq('id', userId)
      .maybeSingle();

    if (userError) {
      throw new BadRequestException(`Failed to fetch user status: ${userError.message}`);
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
    if (hasPending) kycStatus = 'SUBMITTED';
    else if (hasRejected) kycStatus = 'REJECTED';
    else kycStatus = 'APPROVED';
    await this.supabase.getAdminClient().from('users').update({ kyc_status: kycStatus }).eq('id', userId);
    await this.notificationsService.notifyKycStatusChanged({
      userId,
      previousStatus,
      newStatus: kycStatus,
    });
  }
}
