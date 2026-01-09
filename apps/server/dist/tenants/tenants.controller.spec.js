"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tenants_controller_1 = require("./tenants.controller");
const tenants_service_1 = require("./tenants.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
describe('TenantsController', () => {
    let controller;
    let tenantsService;
    const mockRequest = {
        user: {
            id: 'user-1',
            tenantId: 'tenant-1',
        },
    };
    const mockTenant = {
        id: 'tenant-1',
        name: 'Test Tenant',
        slug: 'test-tenant',
        subdomain: 'test',
        contact_email: 'contact@test.com',
        status: create_tenant_dto_1.TenantStatus.ACTIVE,
        created_at: new Date(),
        updated_at: new Date(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [tenants_controller_1.TenantsController],
            providers: [
                {
                    provide: tenants_service_1.TenantsService,
                    useValue: {
                        create: jest.fn(),
                        getById: jest.fn(),
                        getAll: jest.fn(),
                        update: jest.fn(),
                    },
                },
            ],
        }).compile();
        controller = module.get(tenants_controller_1.TenantsController);
        tenantsService = module.get(tenants_service_1.TenantsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('create', () => {
        const createDto = {
            name: 'New Tenant',
            slug: 'new-tenant',
            subdomain: 'new',
            contact_email: 'new@test.com',
        };
        it('should create a new tenant', async () => {
            tenantsService.create.mockResolvedValue(mockTenant);
            const result = await controller.create(createDto, mockRequest);
            expect(result).toEqual(mockTenant);
            expect(tenantsService.create).toHaveBeenCalledWith(createDto, 'user-1');
        });
    });
    describe('getCurrent', () => {
        it('should return current tenant', async () => {
            tenantsService.getById.mockResolvedValue(mockTenant);
            const requestWithTenantId = {
                user: { id: 'user-1', tenant_id: 'tenant-1' },
            };
            const result = await controller.getCurrent(requestWithTenantId);
            expect(result).toEqual(mockTenant);
            expect(tenantsService.getById).toHaveBeenCalledWith('tenant-1');
        });
        it('should throw error if no tenant ID', async () => {
            const requestWithoutTenant = { user: { id: 'user-1' } };
            await expect(controller.getCurrent(requestWithoutTenant)).rejects.toThrow('No tenant associated with user');
        });
    });
    describe('getAll', () => {
        it('should return all tenants', async () => {
            const tenants = [mockTenant];
            tenantsService.getAll.mockResolvedValue(tenants);
            const result = await controller.getAll();
            expect(result).toEqual(tenants);
        });
    });
    describe('update', () => {
        const updateDto = {
            name: 'Updated Tenant',
            status: create_tenant_dto_1.TenantStatus.ACTIVE,
        };
        it('should update tenant', async () => {
            const updatedTenant = { ...mockTenant, ...updateDto };
            tenantsService.update.mockResolvedValue(updatedTenant);
            const mockRequest = {
                user: { id: 'user-1', tenant_id: 'tenant-1' },
            };
            const result = await controller.update('tenant-1', updateDto, mockRequest);
            expect(result).toEqual(updatedTenant);
            expect(tenantsService.update).toHaveBeenCalledWith('tenant-1', updateDto, 'user-1');
        });
    });
});
//# sourceMappingURL=tenants.controller.spec.js.map