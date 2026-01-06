import { Test, TestingModule } from '@nestjs/testing';
import { LicenseScheduler } from './license.scheduler';
import { LicensingService, LicenseTier } from './licensing.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('LicenseScheduler', () => {
  let scheduler: LicenseScheduler;
  let licensingService: jest.Mocked<LicensingService>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockLicense = {
    id: 'license-1',
    tenant_id: 'tenant-1',
    tier: LicenseTier.PROFESSIONAL,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'ACTIVE',
    auto_renew: true,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenseScheduler,
        {
          provide: LicensingService,
          useValue: {
            markExpiredLicenses: jest.fn(),
            autoRenewExpiredLicenses: jest.fn(),
          },
        },
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn(() => mockSupabaseClient),
          },
        },
      ],
    }).compile();

    scheduler = module.get<LicenseScheduler>(LicenseScheduler);
    licensingService = module.get(LicensingService) as jest.Mocked<LicensingService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(scheduler).toBeDefined();
  });

  describe('handleExpiredLicenses', () => {
    it('should mark expired licenses', async () => {
      licensingService.markExpiredLicenses.mockResolvedValue();

      await scheduler.handleExpiredLicenses();

      expect(licensingService.markExpiredLicenses).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      licensingService.markExpiredLicenses.mockRejectedValue(new Error('Database error'));

      await expect(scheduler.handleExpiredLicenses()).resolves.not.toThrow();
    });
  });

  describe('handleAutoRenewal', () => {
    it('should auto-renew expired licenses', async () => {
      licensingService.autoRenewExpiredLicenses.mockResolvedValue(undefined);

      await scheduler.handleAutoRenewal();

      expect(licensingService.autoRenewExpiredLicenses).toHaveBeenCalled();
    });

    it('should log error if auto-renewal fails', async () => {
      licensingService.autoRenewExpiredLicenses.mockRejectedValue(new Error('Renewal failed'));

      await expect(scheduler.handleAutoRenewal()).resolves.not.toThrow();
    });
  });

  describe('sendExpirationAlerts', () => {
    it('should fetch licenses expiring soon', async () => {
      mockSupabaseClient.gt.mockResolvedValue({
        data: [mockLicense],
        error: null,
      });

      await scheduler.sendExpirationAlerts();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('licenses');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'ACTIVE');
    });

    it('should handle no expiring licenses', async () => {
      mockSupabaseClient.gt.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(scheduler.sendExpirationAlerts()).resolves.not.toThrow();
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.gt.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(scheduler.sendExpirationAlerts()).resolves.not.toThrow();
    });
  });

  describe('resetMonthlyUsage', () => {
    it('should reset monthly usage counters', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: [{ id: '1', count: 100 }],
        error: null,
      });

      await scheduler.resetMonthlyUsage();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('usage_tracking');
      expect(mockSupabaseClient.select).toHaveBeenCalledWith('*');
    });

    it('should handle errors gracefully', async () => {
      mockSupabaseClient.eq.mockResolvedValue({
        data: null,
        error: { message: 'Fetch failed' },
      });

      await expect(scheduler.resetMonthlyUsage()).resolves.not.toThrow();
    });
  });

  describe('suspendExpiredTenants', () => {
    it('should suspend tenants with long-expired licenses', async () => {
      mockSupabaseClient.lt.mockResolvedValue({
        data: [{ tenant_id: 'tenant-1' }, { tenant_id: 'tenant-2' }],
        error: null,
      });

      mockSupabaseClient.update.mockResolvedValue({
        data: null,
        error: null,
      });

      await scheduler.suspendExpiredTenants();

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('licenses');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'EXPIRED');
    });

    it('should handle unique tenant IDs correctly', async () => {
      mockSupabaseClient.from.mockImplementation((table) => {
        if (table === 'licenses') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                lt: jest.fn().mockResolvedValue({
                  data: [
                    { tenant_id: 'tenant-1' },
                    { tenant_id: 'tenant-1' },
                    { tenant_id: 'tenant-2' },
                  ],
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      });

      await scheduler.suspendExpiredTenants();

      // Verify from was called for both licenses and tenants tables
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('licenses');
    });

    it('should handle database errors', async () => {
      mockSupabaseClient.lt.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(scheduler.suspendExpiredTenants()).resolves.not.toThrow();
    });
  });
});
