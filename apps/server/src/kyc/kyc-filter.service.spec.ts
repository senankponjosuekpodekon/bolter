import { Test, TestingModule } from '@nestjs/testing';
import { KycFilterService } from './kyc-filter.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('KycFilterService', () => {
  let service: KycFilterService;
  const mockQuery = {
    select: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
  };

  const mockSupabaseClient = {
    from: jest.fn(() => mockQuery),
  } as { from: jest.Mock };

  const mockSupabaseService = {
    getAdminClient: jest.fn(() => mockSupabaseClient),
  } as { getAdminClient: jest.Mock };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KycFilterService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(KycFilterService);
  });

  it('should filter KYC documents with defaults', async () => {
    mockQuery.select.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockResolvedValue({ data: [], error: null, count: 0 });

    const result = await service.filter({});
    expect(result.total).toBe(0);
    expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(mockQuery.range).toHaveBeenCalledWith(0, 24);
  });

  it('should apply filters and pagination', async () => {
    mockQuery.select.mockReturnThis();
    mockQuery.order.mockReturnThis();
    mockQuery.range.mockResolvedValue({ data: [{ id: '1' }], error: null, count: 1 });

    const result = await service.filter({
      dateFrom: '2025-12-01',
      dateTo: '2025-12-05',
      status: 'PENDING,APPROVED',
      documentType: 'PASSPORT',
      userId: 'user-1',
      search: 'passport',
      sortBy: 'status',
      sortOrder: 'asc',
      offset: 5,
      limit: 5,
    });

    expect(result.results.length).toBe(1);
    expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2025-12-01T00:00:00');
    expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2025-12-05T23:59:59');
    expect(mockQuery.in).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith('document_type', 'PASSPORT');
    expect(mockQuery.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(mockQuery.ilike).toHaveBeenCalled();
    expect(mockQuery.order).toHaveBeenCalledWith('status', { ascending: true });
    expect(mockQuery.range).toHaveBeenCalledWith(5, 9);
  });
});
