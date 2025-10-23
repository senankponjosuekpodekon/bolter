import { SupabaseService } from '../supabase/supabase.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
export declare class KycService {
    private supabase;
    constructor(supabase: SupabaseService);
    uploadDocument(userId: string, dto: UploadKycDocumentDto): Promise<any>;
    findByUserId(userId: string): Promise<any[]>;
    findPendingDocuments(): Promise<any[]>;
    reviewDocument(adminId: string, documentId: string, dto: ReviewKycDocumentDto): Promise<any>;
    private updateUserKycStatus;
}
