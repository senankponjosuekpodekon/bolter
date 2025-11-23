import { Request } from 'express';
import { KycService } from './kyc.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
export declare class KycController {
    private readonly kycService;
    constructor(kycService: KycService);
    uploadDocument(req: Request & {
        user?: {
            id?: string;
        };
    }, uploadDto: UploadKycDocumentDto): Promise<any>;
    getUserDocuments(req: Request & {
        user?: {
            id?: string;
        };
    }): Promise<any[]>;
    getPendingDocuments(): Promise<any[]>;
    reviewDocument(req: Request & {
        user?: {
            id?: string;
        };
    }, id: string, reviewDto: ReviewKycDocumentDto): Promise<any>;
}
