import { SupabaseService } from '../supabase/supabase.service';
export declare class KycStorageService {
    private supabase;
    private readonly BUCKET_NAME;
    private readonly MAX_FILE_SIZE;
    constructor(supabase: SupabaseService);
    uploadDocument(userId: string, documentType: string, fileName: string, fileBuffer: Buffer, mimeType: string): Promise<{
        path: string;
        url: string;
    }>;
    getDocumentUrl(filePath: string, expiresIn?: number): Promise<string>;
    deleteDocument(filePath: string): Promise<void>;
    downloadDocument(filePath: string): Promise<Buffer>;
    fileExists(filePath: string): Promise<boolean>;
}
