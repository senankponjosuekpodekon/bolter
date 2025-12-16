import { SupabaseService } from '../supabase/supabase.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { NotificationsService } from '../notifications/notifications.service';
export declare class KycService {
    private supabase;
    private readonly notificationsService;
    constructor(supabase: SupabaseService, notificationsService: NotificationsService);
    uploadDocument(userId: string, dto: UploadKycDocumentDto): Promise<any>;
    findByUserId(userId: string): Promise<any[]>;
    findPendingDocuments(): Promise<any[]>;
    getDocumentById(documentId: string): Promise<any>;
    reviewDocument(adminId: string, documentId: string, dto: ReviewKycDocumentDto): Promise<any>;
    private updateUserKycStatus;
}
