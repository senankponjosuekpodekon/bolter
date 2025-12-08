import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class KycStorageService {
    private readonly BUCKET_NAME = 'kyc-documents';
    private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    constructor(private supabase: SupabaseService) { }

    /**
     * Upload a KYC document to Supabase Storage
     * @param userId User ID
     * @param documentType Type of document (ID_CARD, PASSPORT, SELFIE, PROOF_ADDRESS)
     * @param fileName Original file name
     * @param fileBuffer File content as Buffer
     * @param mimeType MIME type of the file
     * @returns Storage path for the uploaded file
     */
    async uploadDocument(
        userId: string,
        documentType: string,
        fileName: string,
        fileBuffer: Buffer,
        mimeType: string,
    ): Promise<{ path: string; url: string }> {
        // Validate file size
        if (fileBuffer.length > this.MAX_FILE_SIZE) {
            throw new BadRequestException(
                `File size exceeds maximum limit of 5MB. Got ${(fileBuffer.length / 1024 / 1024).toFixed(2)}MB`,
            );
        }

        // Validate MIME type
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/pdf', 'application/pdf'];
        if (!allowedMimeTypes.includes(mimeType)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: JPEG, PNG, PDF. Got ${mimeType}`,
            );
        }

        // Generate unique file path: kyc/{userId}/{documentType}/{timestamp}-{fileName}
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `kyc/${userId}/${documentType}/${timestamp}-${sanitizedFileName}`;

        try {
            // Upload to Supabase Storage
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .upload(filePath, fileBuffer, {
                    contentType: mimeType,
                    upsert: false, // Don't overwrite if exists
                });

            if (error) {
                throw new BadRequestException(`Storage upload failed: ${error.message}`);
            }

            // Generate public URL for the uploaded file
            const { data: publicUrlData } = this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .getPublicUrl(filePath);

            return {
                path: filePath,
                url: publicUrlData.publicUrl,
            };
        } catch (err) {
            throw new BadRequestException(
                `Failed to upload document: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Get a signed URL for accessing a KYC document (admin only)
     * URLs expire after 1 hour by default
     */
    async getDocumentUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
        try {
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .createSignedUrl(filePath, expiresIn);

            if (error) {
                throw new BadRequestException(`Failed to generate URL: ${error.message}`);
            }

            return data.signedUrl;
        } catch (err) {
            throw new BadRequestException(
                `Failed to generate document URL: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Delete a KYC document from storage
     */
    async deleteDocument(filePath: string): Promise<void> {
        try {
            const { error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .remove([filePath]);

            if (error) {
                throw new BadRequestException(`Failed to delete document: ${error.message}`);
            }
        } catch (err) {
            throw new BadRequestException(
                `Failed to delete document: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Download a KYC document from storage
     */
    async downloadDocument(filePath: string): Promise<Buffer> {
        try {
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .download(filePath);

            if (error) {
                throw new BadRequestException(`Failed to download document: ${error.message}`);
            }

            return Buffer.from(await data.arrayBuffer());
        } catch (err) {
            throw new BadRequestException(
                `Failed to download document: ${err instanceof Error ? err.message : 'Unknown error'}`,
            );
        }
    }

    /**
     * Check if a file exists in storage
     */
    async fileExists(filePath: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .getAdminClient()
                .storage.from(this.BUCKET_NAME)
                .list('kyc', { limit: 1 });

            if (error) {
                return false;
            }

            return true;
        } catch {
            return false;
        }
    }
}
