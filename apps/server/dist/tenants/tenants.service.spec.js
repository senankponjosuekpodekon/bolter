"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const common_1 = require("@nestjs/common");
const tenants_service_1 = require("./tenants.service");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const create_tenant_dto_1 = require("./dto/create-tenant.dto");
describe('TenantsService', () => {
    let service;
    let auditLogsService;
    const mockSupabaseClient = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        single: jest.fn(),
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
            providers: [
                tenants_service_1.TenantsService,
                {
                    provide: supabase_service_1.SupabaseService,
                    useValue: {
                        getAdminClient: jest.fn(() => mockSupabaseClient),
                    },
                },
                {
                    provide: audit_logs_service_1.AuditLogsService,
                    useValue: {
                        log: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(tenants_service_1.TenantsService);
        auditLogsService = module.get(audit_logs_service_1.AuditLogsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('create', () => {
        const createDto = {
            name: 'New Tenant',
            slug: 'new-tenant',
            subdomain: 'new',
            contact_email: 'new@test.com',
        };
        it('should create a new tenant successfully', async () => {
            mockSupabaseClient.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
                .mockResolvedValueOnce({ data: mockTenant, error: null });
            const result = await service.create(createDto, 'user-1');
            expect(result).toEqual(mockTenant);
            expect(mockSupabaseClient.insert).toHaveBeenCalled();
            expect(auditLogsService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'CREATE',
                resourceType: 'TENANT',
            }));
        });
        it('should throw BadRequestException if slug already exists', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: { id: 'existing-tenant' },
                error: null,
            });
            await expect(service.create(createDto, 'user-1')).rejects.toThrow(common_1.BadRequestException);
            await expect(service.create(createDto, 'user-1')).rejects.toThrow('Slug "new-tenant" is already taken');
        });
        it('should throw BadRequestException if tenant creation fails', async () => {
            mockSupabaseClient.single
                .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116' } })
                .mockResolvedValueOnce({ data: null, error: { message: 'Insert failed' } });
            await expect(service.create(createDto, 'user-1')).rejects.toThrow(common_1.BadRequestException);
        });
        it('should throw BadRequestException on slug validation error', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { code: 'OTHER_ERROR', message: 'Database error' },
            });
            await expect(service.create(createDto, 'user-1')).rejects.toThrow(common_1.BadRequestException);
            await expect(service.create(createDto, 'user-1')).rejects.toThrow('Failed to validate tenant slug');
        });
    });
    describe('getById', () => {
        it('should return tenant by ID', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: mockTenant,
                error: null,
            });
            const result = await service.getById('tenant-1');
            expect(result).toEqual(mockTenant);
            expect(mockSupabaseClient.from).toHaveBeenCalledWith('tenants');
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('id', 'tenant-1');
        });
        it('should throw NotFoundException if tenant not found', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });
            await expect(service.getById('tenant-1')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getBySlug', () => {
        it('should return tenant by slug', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: mockTenant,
                error: null,
            });
            const result = await service.getBySlug('test-tenant');
            expect(result).toEqual(mockTenant);
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('slug', 'test-tenant');
        });
        it('should throw NotFoundException if tenant not found', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });
            await expect(service.getBySlug('non-existent')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getBySubdomain', () => {
        it('should return tenant by subdomain', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: mockTenant,
                error: null,
            });
            const result = await service.getBySubdomain('test');
            expect(result).toEqual(mockTenant);
            expect(mockSupabaseClient.eq).toHaveBeenCalledWith('subdomain', 'test');
        });
        it('should throw NotFoundException if tenant not found', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });
            await expect(service.getBySubdomain('non-existent')).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('getAll', () => {
        it('should return all tenants with pagination', async () => {
            const tenants = [mockTenant];
            mockSupabaseClient.order.mockResolvedValue({
                data: tenants,
                error: null,
            });
            const result = await service.getAll(10, 0);
            expect(result).toEqual(tenants);
            expect(mockSupabaseClient.range).toHaveBeenCalledWith(0, 9);
            expect(mockSupabaseClient.order).toHaveBeenCalledWith('created_at', { ascending: false });
        });
        it('should return empty array on error', async () => {
            mockSupabaseClient.order.mockResolvedValue({
                data: null,
                error: { message: 'Database error' },
            });
            const result = await service.getAll();
            expect(result).toEqual([]);
        });
    });
    describe('update', () => {
        const updateDto = {
            name: 'Updated Tenant',
            contact_email: 'updated@test.com',
            status: create_tenant_dto_1.TenantStatus.ACTIVE,
        };
        it('should update tenant successfully', async () => {
            const updatedTenant = { ...mockTenant, ...updateDto };
            mockSupabaseClient.single
                .mockResolvedValueOnce({ data: mockTenant, error: null })
                .mockResolvedValueOnce({ data: updatedTenant, error: null });
            const result = await service.update('tenant-1', updateDto, 'user-1');
            expect(result).toEqual(updatedTenant);
            expect(mockSupabaseClient.update).toHaveBeenCalled();
            expect(auditLogsService.log).toHaveBeenCalledWith(expect.objectContaining({
                action: 'UPDATE',
                resourceType: 'TENANT',
            }));
        });
        it('should throw NotFoundException if tenant not found', async () => {
            mockSupabaseClient.single.mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' },
            });
            await expect(service.update('tenant-1', updateDto, 'user-1')).rejects.toThrow(common_1.NotFoundException);
        });
        it('should throw BadRequestException if update fails', async () => {
            mockSupabaseClient.single
                .mockResolvedValueOnce({ data: mockTenant, error: null })
                .mockResolvedValueOnce({ data: null, error: { message: 'Update failed' } });
            await expect(service.update('tenant-1', updateDto, 'user-1')).rejects.toThrow(common_1.BadRequestException);
        });
    });
});
//# sourceMappingURL=tenants.service.spec.js.map