import { SupabaseService } from '../supabase/supabase.service';
export interface UploadAvatarResult {
    url: string;
    path: string;
}
export declare class AvatarService {
    private readonly supabase;
    private readonly bucket;
    private readonly maxBytes;
    private readonly allowedMime;
    constructor(supabase: SupabaseService);
    upload(userId: string, file: {
        mimetype: string;
        size: number;
        buffer: Buffer;
    }): Promise<UploadAvatarResult>;
    get(userId: string): Promise<string>;
    delete(userId: string): Promise<void>;
    private getSignedUrl;
    private getExt;
    private tryLoadSharp;
}
