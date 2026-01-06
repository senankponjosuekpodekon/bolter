import { Test, TestingModule } from '@nestjs/testing';
import { LicensingController } from './licensing.controller';
import { LicensingService, LicenseTier } from './licensing.service';

describe('LicensingController', () => {
  let controller: LicensingController;
  let licensingService: jest.Mocked<LicensingService>;

  const mockRequest = {
    user: {
      id: 'user-1',
      tenant_id: 'tenant-1',
    },
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
    status: 'ACTIVE' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LicensingController],
      providers: [
        {
          provide: LicensingService,
          useValue: {
            getActiveLicense: jest.fn(),
            hasFeature: jest.fn(),
            getRemainingLimit: jest.fn(),
            upgradeLicense: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<LicensingController>(LicensingController);
    licensingService = module.get(LicensingService) as jest.Mocked<LicensingService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrent', () => {
    it('should return current license', async () => {
      licensingService.getActiveLicense.mockResolvedValue(mockLicense);

      const result = await controller.getCurrent(mockRequest);

      expect(result).toEqual(mockLicense);
      expect(licensingService.getActiveLicense).toHaveBeenCalledWith('tenant-1');
    });

    it('should throw error if no tenant ID', async () => {
      const requestWithoutTenant = { user: { id: 'user-1' } };

      await expect(controller.getCurrent(requestWithoutTenant)).rejects.toThrow(
        'No tenant associated with user',
      );
    });
  });

  describe('getAvailableFeatures', () => {
    it('should return available features', async () => {
      licensingService.getActiveLicense.mockResolvedValue(mockLicense);

      const result = await controller.getAvailableFeatures(mockRequest);

      expect(result).toEqual({ modules: mockLicense.modules });
    });

    it('should return empty modules if no license', async () => {
      licensingService.getActiveLicense.mockResolvedValue(null);

      const result = await controller.getAvailableFeatures(mockRequest);

      expect(result).toEqual({ modules: {} });
    });
  });

  describe('getRemainingLimit', () => {
    it('should return remaining limit for feature', async () => {
      licensingService.getRemainingLimit.mockResolvedValue(50000);

      const result = await controller.getRemainingLimit('api_calls', mockRequest);

      const now = new Date();
      const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      expect(result.feature).toBe('api_calls');
      expect(result.remaining).toBe(50000);
      expect(result.currentMonth).toBe(expectedMonth);
    });
  });

  describe('upgrade', () => {
    it('should upgrade license successfully', async () => {
      const upgradeDto = { tier: LicenseTier.ENTERPRISE };
      licensingService.upgradeLicense.mockResolvedValue({
        ...mockLicense,
        tier: LicenseTier.ENTERPRISE,
      });

      const result = await controller.upgrade(upgradeDto, mockRequest);

      expect(result).toEqual(expect.objectContaining({ tier: LicenseTier.ENTERPRISE }));
      expect(licensingService.upgradeLicense).toHaveBeenCalledWith(
        'tenant-1',
        LicenseTier.ENTERPRISE,
        'user-1',
      );
    });
  });
});
