"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const licensing_controller_1 = require("./licensing.controller");
const licensing_service_1 = require("./licensing.service");
describe('LicensingController', () => {
    let controller;
    let licensingService;
    const mockRequest = {
        user: {
            id: 'user-1',
            tenant_id: 'tenant-1',
        },
    };
    const mockLicense = {
        id: 'license-1',
        tenant_id: 'tenant-1',
        tier: licensing_service_1.LicenseTier.PROFESSIONAL,
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
        const module = await testing_1.Test.createTestingModule({
            controllers: [licensing_controller_1.LicensingController],
            providers: [
                {
                    provide: licensing_service_1.LicensingService,
                    useValue: {
                        getActiveLicense: jest.fn(),
                        hasFeature: jest.fn(),
                        getRemainingLimit: jest.fn(),
                        upgradeLicense: jest.fn(),
                    },
                },
            ],
        }).compile();
        controller = module.get(licensing_controller_1.LicensingController);
        licensingService = module.get(licensing_service_1.LicensingService);
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
            await expect(controller.getCurrent(requestWithoutTenant)).rejects.toThrow('No tenant associated with user');
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
            const upgradeDto = { tier: licensing_service_1.LicenseTier.ENTERPRISE };
            licensingService.upgradeLicense.mockResolvedValue({
                ...mockLicense,
                tier: licensing_service_1.LicenseTier.ENTERPRISE,
            });
            const result = await controller.upgrade(upgradeDto, mockRequest);
            expect(result).toEqual(expect.objectContaining({ tier: licensing_service_1.LicenseTier.ENTERPRISE }));
            expect(licensingService.upgradeLicense).toHaveBeenCalledWith('tenant-1', licensing_service_1.LicenseTier.ENTERPRISE, 'user-1');
        });
    });
});
//# sourceMappingURL=licensing.controller.spec.js.map