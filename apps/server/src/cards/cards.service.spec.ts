import { Test, TestingModule } from '@nestjs/testing';
import { CardsService } from './cards.service';
import { CreateCardDto } from './dto/create-card.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-unused-vars */

describe('CardsService', () => {
  let service: CardsService;
  let auditLogsService: AuditLogsService;

  const mockAdminClient = {
    from: jest.fn(),
  };

  const mockCard = {
    id: 'card-123',
    user_id: 'user-123',
    account_id: 'acc-123',
    card_number: '4532123456789000',
    card_type: 'DEBIT',
    status: 'ACTIVE',
    expiry_date: '2025-12',
    cvv: '123',
    created_at: new Date().toISOString(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            notifyCardCreated: jest.fn(),
            notifyCardBlocked: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
    auditLogsService = module.get<AuditLogsService>(AuditLogsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new card successfully', async () => {
      const createCardDto: CreateCardDto = {
        accountId: 'acc-123',
        type: 'PHYSICAL',
      };

      // Mock account verification
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { id: 'acc-123', user_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      });

      // Mock card creation
      mockAdminClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockCard, error: null }),
          }),
        }),
      });

      const result = await service.create('user-123', 'acc-123', createCardDto);

      expect(result).toEqual(mockCard);
      expect(auditLogsService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException on creation failure', async () => {
      // Mock account verification
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Account not found' },
            }),
          }),
        }),
      });

      await expect(
        service.create('user-123', 'acc-123', {
          accountId: 'acc-123',
          type: 'VIRTUAL',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByUserId', () => {
    it('should return all cards for a user', async () => {
      const mockCards = [mockCard, { ...mockCard, id: 'card-456' }];

      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: mockCards, error: null }),
        }),
      });

      const result = await service.findByUserId('user-123');

      expect(result).toEqual(mockCards);
      expect(mockAdminClient.from).toHaveBeenCalledWith('cards');
    });

    it('should return empty array when no cards found', async () => {
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const result = await service.findByUserId('user-123');

      expect(result).toEqual([]);
    });
  });

  describe('update (block card)', () => {
    it('should block a card successfully', async () => {
      // Mock find card
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockCard,
              error: null,
            }),
          }),
        }),
      });

      // Mock account check
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { user_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      });

      // Mock update
      mockAdminClient.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { ...mockCard, status: 'BLOCKED' },
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.update('user-123', 'card-123', { status: 'BLOCKED' });

      expect(result.status).toBe('BLOCKED');
      expect(auditLogsService.log).toHaveBeenCalled();
    });

    it('should throw NotFoundException when card not found', async () => {
      mockAdminClient.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      await expect(service.update('user-123', 'card-123', { status: 'BLOCKED' })).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('delete', () => {
    it('should delete a card successfully', async () => {
      // Mock find card
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockCard,
              error: null,
            }),
          }),
        }),
      });

      // Mock account check
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { user_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      });

      // Mock delete
      mockAdminClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null }),
        }),
      });

      await service.delete('user-123', 'card-123');

      expect(auditLogsService.log).toHaveBeenCalled();
    });

    it('should throw BadRequestException on deletion failure', async () => {
      // Mock find card
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: mockCard,
              error: null,
            }),
          }),
        }),
      });

      // Mock account check
      mockAdminClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { user_id: 'user-123' },
              error: null,
            }),
          }),
        }),
      });

      // Mock delete failure
      mockAdminClient.from.mockReturnValueOnce({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: { message: 'Deletion failed' },
          }),
        }),
      });

      await expect(service.delete('user-123', 'card-123')).rejects.toThrow(
        BadRequestException
      );
    });
  });
});
