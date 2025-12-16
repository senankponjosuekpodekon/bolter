import { BulkOperationsService, BulkActionPayload } from './bulk-operations.service';
import { Request } from 'express';
export declare class BulkOperationsController {
    private readonly bulkOperationsService;
    constructor(bulkOperationsService: BulkOperationsService);
    bulkReviewKYC(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkReviewTransactions(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkFlagKYC(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkFlagTransactions(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkDeleteKYC(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    bulkDeleteTransactions(req: Request & {
        user?: {
            id?: string;
        };
    }, payload: BulkActionPayload): Promise<{
        success: number;
        failed: number;
        details: string[];
    }>;
    getStats(): Promise<{
        pendingKyc: number;
        pendingTransactions: number;
        flaggedItems: number;
        recentBulkActions: number;
    }>;
}
