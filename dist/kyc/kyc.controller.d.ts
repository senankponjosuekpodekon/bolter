import { KycService } from './kyc.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    uploadDocument(req: any, uploadDto: UploadKycDocumentDto): Promise<any>;
    getUserDocuments(req: any): Promise<any[]>;
    getPendingDocuments(): Promise<any[]>;
    reviewDocument(req: any, id: string, reviewDto: ReviewKycDocumentDto): Promise<any>;
}
