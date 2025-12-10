import { describe, it, expect, vi, beforeEach } from 'vitest';
import FilterService from '../filter.service';
import api from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('FilterService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('filterTransactions', () => {
    it('should fetch filtered transactions with parameters', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'tx-1',
              amount: 100,
              status: 'COMPLETED',
              created_at: '2025-01-01',
            },
          ],
          total: 1,
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = {
        dateFrom: '2025-01-01',
        dateTo: '2025-01-31',
        amountMin: 50,
        amountMax: 200,
        status: 'COMPLETED',
      };

      const result = await FilterService.filterTransactions(params);

      expect(result).toEqual(mockResponse.data);
      expect(api.get).toHaveBeenCalledWith('/admin/filter/transactions', { params });
    });

    it('should handle empty results', async () => {
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { results: [], total: 0 },
      });

      const result = await FilterService.filterTransactions({});

      expect(result.results).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should throw error on API failure', async () => {
      (api.get as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      await expect(FilterService.filterTransactions({})).rejects.toThrow(
        'Network error'
      );
    });
  });

  describe('filterKyc', () => {
    it('should fetch filtered KYC documents', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'kyc-1',
              user_id: 'user-123',
              status: 'PENDING',
              document_type: 'PASSPORT',
            },
          ],
          total: 1,
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = {
        status: 'PENDING',
        documentType: 'PASSPORT',
      };

      const result = await FilterService.filterKyc(params);

      expect(result).toEqual(mockResponse.data);
      expect(api.get).toHaveBeenCalledWith('/admin/filter/kyc', { params });
    });
  });

  describe('filterUsers', () => {
    it('should fetch filtered users', async () => {
      const mockResponse = {
        data: {
          results: [
            {
              id: 'user-1',
              email: 'test@example.com',
              kyc_status: 'APPROVED',
            },
          ],
          total: 1,
        },
      };

      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const params = {
        kycStatus: 'APPROVED',
        search: 'test',
      };

      const result = await FilterService.filterUsers(params);

      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('exportFilteredData', () => {
    it('should export data as CSV', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockBlob,
      });

      const params = {
        type: 'transactions',
        format: 'csv',
        dateFrom: '2025-01-01',
      };

      const result = await FilterService.exportFilteredData(params);

      expect(result).toEqual(mockBlob);
      expect(api.get).toHaveBeenCalledWith(
        '/admin/filter/export',
        expect.objectContaining({
          params,
          responseType: 'blob',
        })
      );
    });

    it('should export data as JSON', async () => {
      const mockData = { results: [] };
      (api.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: mockData,
      });

      const params = {
        type: 'kyc',
        format: 'json',
      };

      const result = await FilterService.exportFilteredData(params);

      expect(result).toEqual(mockData);
    });
  });
});
