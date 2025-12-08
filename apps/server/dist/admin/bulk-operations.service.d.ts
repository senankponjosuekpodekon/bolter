import { SupabaseService } from '../supabase/supabase.service';
import { ActivityLogService } from '../auth/activity-log.service';
export interface BulkActionPayload {
    ids: string[];
    action: 'approve' | 'reject' | 'delete' | 'flag';
    reason?: string;
    notes?: string;
}
export declare class BulkOperationsService {
    private supabase;
    private activityLog;
    constructor(supabase: SupabaseService, activityLog: ActivityLogService);
    bulkReviewKYCDocuments(userId: string, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkReviewTransactions(userId: string, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkFlagItems(userId: string, resourceType: 'kyc_documents' | 'transactions', payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkDeleteItems(userId: string, resourceType: 'kyc_documents' | 'transactions', payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    getBulkOperationStats(userId: string): Promise<{
        pendingKyc: number;
        pendingTransactions: number;
        flaggedItems: number;
        recentBulkActions: number;
    }>;
}
