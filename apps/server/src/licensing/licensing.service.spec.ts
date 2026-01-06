import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { LicensingService, LicenseTier } from './licensing.service';
import { SupabaseService } from '../supabase/supabase.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

describe('LicensingService', () => {
  let service: LicensingService;
  let auditLogsService: jest.Mocked<AuditLogsService>;

  const mockSupabaseClient = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    single: jest.fn(),
  };

  const mockLicense = {
    id: 'license-1',
    tenant_id: 'tenant-1',
    tier: LicenseTier.PROFESSIONAL,
    starts_at: new Date(),
    expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    auto_renew: true,
    modules: {
      accounts: true,
      transactions: true,
      loans: true,
      cards: true,
      tontines: true,
    },
    limits: {
      monthly_transactions: 100000,
      api_calls: 1000000,
      storage_gb: 10,
      active_users: 50,
    },
    status: 'ACTIVE',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicensingService,
        {
          provide: SupabaseService,
          useValue: {
            getAdminClient: jest.fn(() => mockSupabaseClient),
          },
        },
        {
          provide: AuditLogsService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LicensingService>(LicensingService);
    auditLogsService = module.get(AuditLogsService) as jest.Mocked<AuditLogsService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getActiveLicense', () => {
    it('should return active license for tenant', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockLicense,
        error: null,
      });

      const result = await service.getActiveLicense('tenant-1');

      expect(result).toEqual(mockLicense);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('licenses');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('tenant_id', 'tenant-1');
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'ACTIVE');
    });

    it('should return null if no license found', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116', message: 'Not found' },
      });

      const result = await service.getActiveLicense('tenant-1');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      const result = await service.getActiveLicense('tenant-1');

      expect(result).toBeNull();
    });
  });

  describe('hasFeature', () => {
    it('should return true if feature is available', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockLicense,
        error: null,
      });

      const result = await service.hasFeature('tenant-1', 'loans');

      expect(result).toBe(true);
    });

    it('should return false if feature is not available', async () => {
      const starterLicense = {
        ...mockLicense,
        tier: LicenseTier.STARTER,
        modules: { ...mockLicense.modules, loans: false },
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: starterLicense,
        error: null,
      });

      const result = await service.hasFeature('tenant-1', 'loans');

      expect(result).toBe(false);
    });

    it('should return false if no active license', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.hasFeature('tenant-1', 'loans');

      expect(result).toBe(false);
    });

    it('should return false if license is expired', async () => {
      const expiredLicense = {
        ...mockLicense,
        expires_at: new Date(Date.now() - 1000),
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: expiredLicense,
        error: null,
      });

      const result = await service.hasFeature('tenant-1', 'loans');

      expect(result).toBe(false);
    });
  });

  describe('validateFeature', () => {
    it('should not throw if feature is available', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: mockLicense,
        error: null,
      });

      await expect(service.validateFeature('tenant-1', 'loans')).resolves.not.toThrow();
    });

    it('should throw BadRequestException if feature is not available', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(service.validateFeature('tenant-1', 'loans')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkRateLimit', () => {
    it('should return false if limit not exceeded', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockLicense, error: null })
        .mockResolvedValueOnce({ data: { count: 5000 }, error: null });

      const result = await service.checkRateLimit('tenant-1', 'monthly_transactions');

      expect(result).toBe(false);
    });

    it('should return true if limit exceeded', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: mockLicense, error: null })
        .mockResolvedValueOnce({ data: { count: 100000 }, error: null });

      const result = await service.checkRateLimit('tenant-1', 'monthly_transactions');

      expect(result).toBe(true);
    });

    it('should return false for unlimited features', async () => {
      const enterpriseLicense = {
        ...mockLicense,
        tier: LicenseTier.ENTERPRISE,
        limits: { monthly_transactions: -1 },
      };

      mockSupabaseClient.single.mockResolvedValue({
        data: enterpriseLicense,
        error: null,
      });

      const result = await service.checkRateLimit('tenant-1', 'monthly_transactions');

      expect(result).toBe(false);
    });

    it('should return true if no license', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await service.checkRateLimit('tenant-1', 'monthly_transactions');

      expect(result).toBe(true);
    });
  });

  describe('incrementUsage', () => {
    it('should update existing usage record', async () => {
      const existingUsage = { id: 'usage-1', count: 100 };

      mockSupabaseClient.single.mockResolvedValue({
        data: existingUsage,
        error: null,
      });

      await service.incrementUsage('tenant-1', 'api_calls', 10);

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ count: 110 });
    });

    it('should create new usage record if not exists', async () => {
      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
        .mockResolvedValueOnce({ data: mockLicense, error: null });

      await service.incrementUsage('tenant-1', 'api_calls', 10);

      expect(mockSupabaseClient.insert).toHaveBeenCalled();
    });
  });

  describe('upgradeLicense', () => {
    it('should upgrade license successfully', async () => {
      const currentLicense = { ...mockLicense, tier: LicenseTier.STARTER };
      const newLicense = { ...mockLicense, tier: LicenseTier.PROFESSIONAL };

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: currentLicense, error: null })
        .mockResolvedValueOnce({ data: newLicense, error: null });

      const result = await service.upgradeLicense(
        'tenant-1',
        LicenseTier.PROFESSIONAL,
        'user-1',
      );

      expect(result).toEqual(newLicense);
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'CANCELLED' });
      expect(mockSupabaseClient.insert).toHaveBeenCalled();
      expect(auditLogsService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'LICENSE_UPGRADE',
          resourceType: 'LICENSE',
        }),
      );
    });

    it('should throw NotFoundException if no active license', async () => {
      mockSupabaseClient.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      await expect(
        service.upgradeLicense('tenant-1', LicenseTier.PROFESSIONAL, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if upgrade fails', async () => {
      const currentLicense = { ...mockLicense, tier: LicenseTier.STARTER };

      mockSupabaseClient.single
        .mockResolvedValueOnce({ data: currentLicense, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });

      await expect(
        service.upgradeLicense('tenant-1', LicenseTier.PROFESSIONAL, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('markExpiredLicenses', () => {
    it('should mark expired licenses', async () => {
      mockSupabaseClient.lt = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      await service.markExpiredLicenses();

      expect(mockSupabaseClient.update).toHaveBeenCalledWith({ status: 'EXPIRED' });
      expect(mockSupabaseClient.eq).toHaveBeenCalledWith('status', 'ACTIVE');
      expect(mockSupabaseClient.lt).toHaveBeenCalled();
    });
  });
});
