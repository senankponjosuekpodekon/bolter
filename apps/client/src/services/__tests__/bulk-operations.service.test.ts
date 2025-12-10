import { describe, it, expect, vi, beforeEach } from 'vitest';
import BulkOperationsService from '../bulk-operations.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe('BulkOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bulkApprove', () => {
    it('should approve multiple items', async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 0,
          results: [
            { id: 'item-1', success: true },
            { id: 'item-2', success: true },
          ],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await BulkOperationsService.bulkApprove('transactions', [
        'item-1',
        'item-2',
      ]);

      expect(result).toEqual(mockResponse.data);
      expect(api.post).toHaveBeenCalledWith('/admin/bulk/approve/transactions', {
        ids: ['item-1', 'item-2'],
      });
    });

    it('should handle partial failures', async () => {
      const mockResponse = {
        data: {
          successCount: 1,
          failureCount: 1,
          results: [
            { id: 'item-1', success: true },
            { id: 'item-2', success: false, error: 'Invalid status' },
          ],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await BulkOperationsService.bulkApprove('kyc', [
        'item-1',
        'item-2',
      ]);

      expect(result.successCount).toBe(1);
      expect(result.failureCount).toBe(1);
    });
  });

  describe('bulkReject', () => {
    it('should reject multiple items with reason', async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 0,
          results: [],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await BulkOperationsService.bulkReject(
        'kyc',
        ['item-1', 'item-2'],
        'Insufficient documentation'
      );

      expect(result.successCount).toBe(2);
      expect(api.post).toHaveBeenCalledWith('/admin/bulk/reject/kyc', {
        ids: ['item-1', 'item-2'],
        reason: 'Insufficient documentation',
      });
    });
  });

  describe('bulkDelete', () => {
    it('should delete multiple items', async () => {
      const mockResponse = {
        data: {
          successCount: 3,
          failureCount: 0,
          results: [],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await BulkOperationsService.bulkDelete('transactions', [
        'tx-1',
        'tx-2',
        'tx-3',
      ]);

      expect(result.successCount).toBe(3);
    });

    it('should handle empty array', async () => {
      const result = await BulkOperationsService.bulkDelete('transactions', []);

      expect(api.post).not.toHaveBeenCalled();
      expect(result).toBeUndefined();
    });
  });

  describe('bulkUpdate', () => {
    it('should update multiple items with data', async () => {
      const mockResponse = {
        data: {
          successCount: 2,
          failureCount: 0,
          results: [],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const updates = { status: 'ACTIVE' };
      const result = await BulkOperationsService.bulkUpdate(
        'users',
        ['user-1', 'user-2'],
        updates
      );

      expect(result.successCount).toBe(2);
      expect(api.post).toHaveBeenCalledWith('/admin/bulk/update/users', {
        ids: ['user-1', 'user-2'],
        updates,
      });
    });
  });

  describe('getBulkOperationStats', () => {
    it('should fetch bulk operation statistics', async () => {
      const mockStats = {
        data: {
          pendingKyc: 10,
          pendingTransactions: 5,
          flaggedItems: 2,
          recentBulkActions: 15,
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockStats);

      const result = await BulkOperationsService.getBulkOperationStats();

      expect(result).toEqual(mockStats.data);
      expect(api.get).toHaveBeenCalledWith('/admin/bulk/stats');
    });
  });

  describe('validateBulkOperation', () => {
    it('should validate if operation can be performed', async () => {
      const mockValidation = {
        data: {
          valid: true,
          invalidIds: [],
          warnings: [],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockValidation);

      const result = await BulkOperationsService.validateBulkOperation(
        'approve',
        'transactions',
        ['tx-1', 'tx-2']
      );

      expect(result.valid).toBe(true);
      expect(result.invalidIds).toEqual([]);
    });

    it('should return validation errors', async () => {
      const mockValidation = {
        data: {
          valid: false,
          invalidIds: ['tx-2'],
          warnings: ['Transaction tx-2 is already completed'],
        },
      };

      (api.post as ReturnType<typeof vi.fn>).mockResolvedValue(mockValidation);

      const result = await BulkOperationsService.validateBulkOperation(
        'approve',
        'transactions',
        ['tx-1', 'tx-2']
      );

      expect(result.valid).toBe(false);
      expect(result.invalidIds).toContain('tx-2');
    });
  });
});
