import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ActivityLogService } from '../auth/activity-log.service';

export interface BulkActionPayload {
    ids: string[];
    action: 'approve' | 'reject' | 'delete' | 'flag';
    reason?: string;
    notes?: string;
}

@Injectable()
export class BulkOperationsService {
    constructor(
        private supabase: SupabaseService,
        private activityLog: ActivityLogService,
    ) { }

    /**
     * Bulk approve/reject KYC documents
     */
    async bulkReviewKYCDocuments(
        userId: string,
        payload: BulkActionPayload,
    ): Promise<{ success: number; failed: number; details: string[] }> {
        const { ids, action, reason } = payload;

        if (!ids || ids.length === 0) {
            throw new BadRequestException('No document IDs provided');
        }

        if (!['approve', 'reject'].includes(action)) {
            throw new BadRequestException(
                'Invalid action. Must be "approve" or "reject"',
            );
        }

        const results = { success: 0, failed: 0, details: [] as string[] };

        for (const docId of ids) {
            try {
                const { data: doc } = await this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('*')
                    .eq('id', docId)
                    .maybeSingle();

                if (!doc) {
                    results.failed++;
                    results.details.push(`Document ${docId}: Not found`);
                    continue;
                }

                const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

                const { error } = await this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .update({
                        status: newStatus,
                        reviewed_by: userId,
                        reviewed_at: new Date().toISOString(),
                        review_notes: reason || null,
                    })
                    .eq('id', docId);

                if (error) {
                    results.failed++;
                    results.details.push(`Document ${docId}: ${error.message}`);
                } else {
                    results.success++;
                    results.details.push(`Document ${docId}: ${newStatus}`);

                    // Log activity
                    await this.activityLog.logActivity({
                        userId,
                        action: `kyc_document_${newStatus.toLowerCase()}`,
                        resourceId: docId,
                        resourceType: 'kyc_document',
                        changes: { status: newStatus, notes: reason },
                    });
                }
            } catch (err) {
                results.failed++;
                results.details.push(
                    `Document ${docId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                );
            }
        }

        return results;
    }

    /**
     * Bulk approve/reject transactions
     */
    async bulkReviewTransactions(
        userId: string,
        payload: BulkActionPayload,
    ): Promise<{ success: number; failed: number; details: string[] }> {
        const { ids, action, reason } = payload;

        if (!ids || ids.length === 0) {
            throw new BadRequestException('No transaction IDs provided');
        }

        if (!['approve', 'reject'].includes(action)) {
            throw new BadRequestException(
                'Invalid action. Must be "approve" or "reject"',
            );
        }

        const results = { success: 0, failed: 0, details: [] as string[] };

        for (const txId of ids) {
            try {
                const { data: tx } = await this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .select('*')
                    .eq('id', txId)
                    .maybeSingle();

                if (!tx) {
                    results.failed++;
                    results.details.push(`Transaction ${txId}: Not found`);
                    continue;
                }

                if (tx.status !== 'PENDING') {
                    results.failed++;
                    results.details.push(
                        `Transaction ${txId}: Cannot modify non-pending transaction (current status: ${tx.status})`,
                    );
                    continue;
                }

                const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

                const { error } = await this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .update({
                        status: newStatus,
                        reviewed_by: userId,
                        reviewed_at: new Date().toISOString(),
                        review_notes: reason || null,
                    })
                    .eq('id', txId);

                if (error) {
                    results.failed++;
                    results.details.push(`Transaction ${txId}: ${error.message}`);
                } else {
                    results.success++;
                    results.details.push(`Transaction ${txId}: ${newStatus}`);

                    // Log activity
                    await this.activityLog.logActivity({
                        userId,
                        action: `transaction_${newStatus.toLowerCase()}`,
                        resourceId: txId,
                        resourceType: 'transaction',
                        changes: { status: newStatus, notes: reason },
                    });
                }
            } catch (err) {
                results.failed++;
                results.details.push(
                    `Transaction ${txId}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                );
            }
        }

        return results;
    }

    /**
     * Bulk flag transactions/documents for manual review
     */
    async bulkFlagItems(
        userId: string,
        resourceType: 'kyc_documents' | 'transactions',
        payload: BulkActionPayload,
    ): Promise<{ success: number; failed: number; details: string[] }> {
        const { ids, reason } = payload;

        if (!ids || ids.length === 0) {
            throw new BadRequestException('No IDs provided');
        }

        const results = { success: 0, failed: 0, details: [] as string[] };

        for (const id of ids) {
            try {
                const { error } = await this.supabase
                    .getAdminClient()
                    .from(resourceType)
                    .update({
                        flagged_for_review: true,
                        flagged_at: new Date().toISOString(),
                        flagged_by: userId,
                        flag_reason: reason || null,
                    })
                    .eq('id', id);

                if (error) {
                    results.failed++;
                    results.details.push(`${id}: ${error.message}`);
                } else {
                    results.success++;
                    results.details.push(`${id}: Flagged for review`);

                    await this.activityLog.logActivity({
                        userId,
                        action: `${resourceType}_flagged`,
                        resourceId: id,
                        resourceType,
                        changes: { flagged: true, reason },
                    });
                }
            } catch (err) {
                results.failed++;
                results.details.push(
                    `${id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                );
            }
        }

        return results;
    }

    /**
     * Bulk delete items (with soft delete option)
     */
    async bulkDeleteItems(
        userId: string,
        resourceType: 'kyc_documents' | 'transactions',
        payload: BulkActionPayload,
    ): Promise<{ success: number; failed: number; details: string[] }> {
        const { ids } = payload;

        if (!ids || ids.length === 0) {
            throw new BadRequestException('No IDs provided');
        }

        const results = { success: 0, failed: 0, details: [] as string[] };

        for (const id of ids) {
            try {
                // Soft delete: mark as deleted rather than removing completely
                const { error } = await this.supabase
                    .getAdminClient()
                    .from(resourceType)
                    .update({
                        deleted_at: new Date().toISOString(),
                        deleted_by: userId,
                    })
                    .eq('id', id);

                if (error) {
                    results.failed++;
                    results.details.push(`${id}: ${error.message}`);
                } else {
                    results.success++;
                    results.details.push(`${id}: Deleted`);

                    await this.activityLog.logActivity({
                        userId,
                        action: `${resourceType}_deleted`,
                        resourceId: id,
                        resourceType,
                        changes: { deleted: true },
                    });
                }
            } catch (err) {
                results.failed++;
                results.details.push(
                    `${id}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                );
            }
        }

        return results;
    }

    /**
     * Get bulk operation statistics
     */
    async getBulkOperationStats(userId: string): Promise<{
        pendingKyc: number;
        pendingTransactions: number;
        flaggedItems: number;
        recentBulkActions: number;
    }> {
        try {
            const [kycResult, txResult, flaggedResult] = await Promise.all([
                this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
                this.supabase
                    .getAdminClient()
                    .from('transactions')
                    .select('id', { count: 'exact', head: true })
                    .eq('status', 'PENDING'),
                this.supabase
                    .getAdminClient()
                    .from('kyc_documents')
                    .select('id', { count: 'exact', head: true })
                    .eq('flagged_for_review', true),
            ]);

            return {
                pendingKyc: kycResult.count || 0,
                pendingTransactions: txResult.count || 0,
                flaggedItems: flaggedResult.count || 0,
                recentBulkActions: 0, // Can be tracked separately if needed
            };
        } catch (err) {
            return {
                pendingKyc: 0,
                pendingTransactions: 0,
                flaggedItems: 0,
                recentBulkActions: 0,
            };
        }
    }
}
