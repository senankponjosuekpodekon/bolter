import { NotificationsService } from './notifications.service';

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('NotificationsService (Simplified)', () => {
  let service: NotificationsService;

  beforeEach(() => {
    const mockEmailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    const mockGateway = {
      notifyUser: jest.fn(),
      notifyUsers: jest.fn(),
    };

    const mockSupabaseService = {
      getAdminClient: jest.fn().mockImplementation(() => ({
        from: jest.fn().mockImplementation(() => ({
          insert: jest.fn().mockResolvedValue({ error: null }),
          select: jest.fn().mockImplementation(function () {
            return {
              eq: jest.fn().mockImplementation(function () {
                return {
                  maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                };
              }),
            };
          }),
          update: jest.fn().mockResolvedValue({ error: null }),
        })),
      })),
    };

    const mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string> = {
          EMAIL_SENDER: 'test@example.com',
          APP_URL: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    service = new NotificationsService(
      mockEmailService as any,
      mockGateway as any,
      mockSupabaseService as any,
      mockLogger as any,
      mockConfigService as any,
    );
  }); describe('Service Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have notifyTransactionCreated method', () => {
      expect(service.notifyTransactionCreated).toBeDefined();
    });

    it('should have notifyLoanCreated method', () => {
      expect(service.notifyLoanCreated).toBeDefined();
    });

    it('should have notifyKycStatusChanged method', () => {
      expect(service.notifyKycStatusChanged).toBeDefined();
    });
  });

  describe('notifyTransactionCreated', () => {
    it('should handle transaction notification', async () => {
      const result = await service.notifyTransactionCreated({
        transactionId: 'tx-123',
        userId: 'user-123',
        amount: 100,
        type: 'TRANSFER',
        currency: 'EUR',
        description: 'Test transfer',
      });

      // Should complete without throwing
      expect(result).toBeUndefined();
    });
  });

  describe('notifyLoanCreated', () => {
    it('should handle loan notification', async () => {
      const result = await service.notifyLoanCreated({
        loanId: 'loan-123',
        userId: 'user-123',
        amount: 10000,
        durationMonths: 24,
        monthlyPayment: 450,
      });

      // Should complete without throwing
      expect(result).toBeUndefined();
    });
  });

  describe('notifyKycStatusChanged', () => {
    it('should handle KYC status change notification', async () => {
      const result = await service.notifyKycStatusChanged({
        userId: 'user-123',
        previousStatus: 'PENDING',
        newStatus: 'APPROVED',
      });

      // Should complete without throwing
      expect(result).toBeUndefined();
    });
  });
});
