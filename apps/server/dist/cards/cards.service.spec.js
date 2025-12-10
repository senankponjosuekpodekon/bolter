"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const cards_service_1 = require("./cards.service");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
const common_1 = require("@nestjs/common");
describe('CardsService', () => {
    let service;
    let auditLogsService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                cards_service_1.CardsService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {
                        getAdminClient: jest.fn().mockReturnValue(mockAdminClient),
                    },
                },
                {
                    provide: audit_logs_service_1.AuditLogsService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
                {
                    provide: notifications_service_1.NotificationsService,
                    useValue: {
                        notifyCardCreated: jest.fn(),
                        notifyCardBlocked: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(cards_service_1.CardsService);
        auditLogsService = module.get(audit_logs_service_1.AuditLogsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a new card successfully', async () => {
            const createCardDto = {
                accountId: 'acc-123',
                type: 'PHYSICAL',
            };
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
            await expect(service.create('user-123', 'acc-123', {
                accountId: 'acc-123',
                type: 'VIRTUAL',
            })).rejects.toThrow(common_1.BadRequestException);
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
            await expect(service.update('user-123', 'card-123', { status: 'BLOCKED' })).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('delete', () => {
        it('should delete a card successfully', async () => {
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
            mockAdminClient.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({ error: null }),
                }),
            });
            await service.delete('user-123', 'card-123');
            expect(auditLogsService.log).toHaveBeenCalled();
        });
        it('should throw BadRequestException on deletion failure', async () => {
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
            mockAdminClient.from.mockReturnValueOnce({
                delete: jest.fn().mockReturnValue({
                    eq: jest.fn().mockResolvedValue({
                        error: { message: 'Deletion failed' },
                    }),
                }),
            });
            await expect(service.delete('user-123', 'card-123')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=cards.service.spec.js.map