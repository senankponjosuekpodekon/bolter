import { Request, Response } from 'express';
import { KycService } from './kyc.service';
import { KycFilterService } from './kyc-filter.service';
import { KycStorageService } from './kyc-storage.service';
import { UploadKycDocumentDto } from './dto/upload-kyc-document.dto';
import { ReviewKycDocumentDto } from './dto/review-kyc-document.dto';
import { KycFilterDto } from './dto/kyc-filter.dto';
export declare class KycController {
    private readonly kycService;
    private readonly kycFilterService;
    private readonly kycStorageService;
    constructor(kycService: KycService, kycFilterService: KycFilterService, kycStorageService: KycStorageService);
    uploadDocument(req: Request & {
        user?: {
            id?: string;
        };
    }, uploadDto: UploadKycDocumentDto): Promise<any>;
    uploadFile(req: Request & {
        user?: {
            id?: string;
        };
    }, file: {
        originalname: string;
        buffer: Buffer;
        mimetype: string;
        size: number;
    }, documentType: string): Promise<any>;
    getUserDocuments(req: Request & {
        user?: {
            id?: string;
        };
    }): Promise<any[]>;
    getPendingDocuments(): Promise<any[]>;
    viewDocument(documentId: string): Promise<{
        id: any;
        documentType: any;
        fileName: any;
        url: string;
        uploadedAt: any;
        status: any;
    }>;
    downloadDocument(documentId: string, res: Response): Promise<void>;
    reviewDocument(req: Request & {
        user?: {
            id?: string;
        };
    }, id: string, reviewDto: ReviewKycDocumentDto): Promise<any>;
    filterApplications(query: KycFilterDto): Promise<import("./dto/kyc-filter.dto").KycFilterResult<Record<string, unknown>>>;
}
