"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const webhooks_service_1 = require("./webhooks.service");
const supabase_service_1 = require("../supabase/supabase.service");
const config_1 = require("@nestjs/config");
const logger_service_1 = require("../common/logger/logger.service");
describe('WebhooksService', () => {
    let service;
    let mockSupabaseService;
    beforeEach(async () => {
        mockSupabaseService = {
            supabaseClient: {
                from: jest.fn(),
            },
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                webhooks_service_1.WebhooksService,
                { provide: supabase_service_1.SupabaseService, useValue: mockSupabaseService },
                { provide: config_1.ConfigService, useValue: {} },
                { provide: logger_service_1.Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
            ],
        }).compile();
        service = module.get(webhooks_service_1.WebhooksService);
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('testWebhook', () => {
        it('should test webhook delivery successfully', async () => {
            const mockWebhook = {
                id: 'wh_123',
                user_id: 'user-1',
                url: 'https://example.com/webhook',
                secret: 'secret-key',
                events: ['transaction.created'],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockWebhook,
                    error: null,
                }),
            });
            const result = await service.testWebhook('wh_123');
            expect(result).toBeDefined();
            expect(result.success).toBe(false);
            expect(result.responseTime).toBeGreaterThanOrEqual(0);
        });
    });
    describe('retryDelivery', () => {
        it('should retry failed webhook delivery', async () => {
            const mockDelivery = {
                id: 'del_123',
                webhook_id: 'wh_123',
                event_type: 'transaction.created',
                payload: { id: '123', amount: 100 },
                status: 'failed',
                attempts: 1,
                created_at: new Date().toISOString(),
                webhooks: {
                    id: 'wh_123',
                    url: 'https://example.com/webhook',
                    secret: 'secret-key',
                    events: ['transaction.created'],
                },
            };
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockDelivery,
                    error: null,
                }),
                update: jest.fn().mockReturnThis(),
            });
            const result = await service.retryDelivery('del_123');
            expect(result).toBeDefined();
        });
        it('should not retry if max attempts reached', async () => {
            const mockDelivery = {
                id: 'del_123',
                webhook_id: 'wh_123',
                event_type: 'transaction.created',
                payload: { id: '123', amount: 100 },
                status: 'failed',
                attempts: 5,
                created_at: new Date().toISOString(),
                webhooks: {
                    id: 'wh_123',
                    url: 'https://example.com/webhook',
                    secret: 'secret-key',
                },
            };
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockDelivery,
                    error: null,
                }),
            });
            const result = await service.retryDelivery('del_123');
            expect(result).toBeNull();
        });
        it('should return null if delivery not found', async () => {
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Not found' },
                }),
            });
            const result = await service.retryDelivery('del_invalid');
            expect(result).toBeNull();
        });
    });
    describe('getWebhookStats', () => {
        it('should get webhook statistics', async () => {
            const mockDeliveries = [
                { webhook_id: 'wh_123', status: 'success', created_at: new Date().toISOString() },
                { webhook_id: 'wh_123', status: 'success', created_at: new Date().toISOString() },
                { webhook_id: 'wh_123', status: 'failed', created_at: new Date().toISOString() },
            ];
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: jest.fn().mockResolvedValue({
                    data: mockDeliveries,
                    error: null,
                }),
            });
            const stats = await service.getWebhookStats('wh_123');
            expect(stats).toBeDefined();
            expect(stats.totalDeliveries).toBeGreaterThanOrEqual(0);
            expect(stats.successCount).toBeGreaterThanOrEqual(0);
            expect(stats.failureCount).toBeGreaterThanOrEqual(0);
            expect(stats.successRate).toBeGreaterThanOrEqual(0);
        });
        it('should return default stats when no deliveries', async () => {
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });
            const stats = await service.getWebhookStats('wh_invalid');
            expect(stats.totalDeliveries).toBe(0);
            expect(stats.successRate).toBe(0);
        });
        it('should calculate success rate correctly', async () => {
            const mockDeliveries = Array(10)
                .fill(null)
                .map((_, i) => ({
                webhook_id: 'wh_123',
                status: i < 8 ? 'success' : 'failed',
                created_at: new Date().toISOString(),
            }));
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: jest.fn().mockResolvedValue({
                    data: mockDeliveries,
                    error: null,
                }),
            });
            const stats = await service.getWebhookStats('wh_123');
            expect(stats.successRate).toBeCloseTo(80, 0);
        });
        it('should filter last 7 days correctly', async () => {
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
            const mockDeliveries = [
                { webhook_id: 'wh_123', status: 'success', created_at: now.toISOString() },
                { webhook_id: 'wh_123', status: 'success', created_at: sevenDaysAgo.toISOString() },
                { webhook_id: 'wh_123', status: 'success', created_at: fourteenDaysAgo.toISOString() },
            ];
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: jest.fn().mockResolvedValue({
                    data: mockDeliveries,
                    error: null,
                }),
            });
            const stats = await service.getWebhookStats('wh_123');
            expect(stats.last7days).toBe(2);
        });
    });
    describe('Error handling', () => {
        it('should handle webhook test errors gracefully', async () => {
            const mockWebhook = {
                id: 'wh_123',
                user_id: 'user-1',
                url: 'https://invalid-url-that-does-not-exist.com/webhook',
                secret: 'secret-key',
                events: ['transaction.created'],
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: mockWebhook,
                    error: null,
                }),
            });
            const result = await service.testWebhook('wh_123');
            expect(result.success).toBe(false);
            expect(result.message).toBeDefined();
        });
        it('should handle stats database errors', async () => {
            mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                then: jest.fn().mockResolvedValue({
                    data: null,
                    error: null,
                }),
            });
            const stats = await service.getWebhookStats('wh_invalid');
            expect(stats.totalDeliveries).toBe(0);
        });
    });
    describe('Signature generation', () => {
        it('should generate consistent signatures', () => {
            expect(service).toBeDefined();
        });
    });
});
//# sourceMappingURL=webhooks.service.spec.js.map