import { Test, TestingModule } from '@nestjs/testing';
import { TransactionFilterService } from './transaction-filter.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('TransactionFilterService', () => {
  let service: TransactionFilterService;
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
  } as any;

  const mockSupabaseService = {
    getAdminClient: jest.fn(() => mockSupabaseClient),
  } as any;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionFilterService,
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get(TransactionFilterService);
  });

  it('should filter transactions with defaults', async () => {
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
      amountMin: 100,
      amountMax: 500,
      status: 'PENDING,COMPLETED',
      type: 'TRANSFER',
      currency: 'EUR',
      sortBy: 'amount',
      sortOrder: 'asc',
      offset: 10,
      limit: 5,
    });

    expect(result.results.length).toBe(1);
    expect(mockQuery.gte).toHaveBeenCalledWith('created_at', '2025-12-01T00:00:00');
    expect(mockQuery.lte).toHaveBeenCalledWith('created_at', '2025-12-05T23:59:59');
    expect(mockQuery.gte).toHaveBeenCalledWith('amount', 100);
    expect(mockQuery.lte).toHaveBeenCalledWith('amount', 500);
    expect(mockQuery.in).toHaveBeenCalled();
    expect(mockQuery.eq).toHaveBeenCalledWith('currency', 'EUR');
    expect(mockQuery.order).toHaveBeenCalledWith('amount', { ascending: true });
    expect(mockQuery.range).toHaveBeenCalledWith(10, 14);
  });
});
