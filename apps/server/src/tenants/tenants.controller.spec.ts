import { Test, TestingModule } from '@nestjs/testing';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantStatus } from './dto/create-tenant.dto';

describe('TenantsController', () => {
  let controller: TenantsController;
  let tenantsService: jest.Mocked<TenantsService>;

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
    status: TenantStatus.ACTIVE,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: TenantsService,
          useValue: {
            create: jest.fn(),
            getById: jest.fn(),
            getAll: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TenantsController>(TenantsController);
    tenantsService = module.get(TenantsService) as jest.Mocked<TenantsService>;
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

      await expect(controller.getCurrent(requestWithoutTenant)).rejects.toThrow(
        'No tenant associated with user',
      );
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
      status: TenantStatus.ACTIVE,
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
