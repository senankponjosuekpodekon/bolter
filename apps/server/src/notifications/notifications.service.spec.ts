import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { SupabaseService } from '../supabase/supabase.service';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import { ConfigService } from '@nestjs/config';
import { Logger } from '../common/logger/logger.service';

describe('NotificationsService - Sprint III Extensions', () => {
  let service: NotificationsService;
  let mockSupabaseService: any;

  beforeEach(async () => {
    mockSupabaseService = {
      supabaseClient: {
        from: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: EmailService, useValue: { sendEmail: jest.fn() } },
        { provide: NotificationsGateway, useValue: {} },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: Logger, useValue: { log: jest.fn(), error: jest.fn(), warn: jest.fn() } },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationPreferences', () => {
    it('should get user notification preferences', async () => {
      const mockPrefs = {
        user_id: 'user-1',
        tenant_id: 'tenant-1',
        transaction_notifications: true,
        transaction_channels: ['email', 'in-app'],
        kyc_notifications: true,
        kyc_channels: ['email'],
        loan_notifications: false,
        loan_channels: [],
        system_notifications: true,
        system_channels: ['in-app'],
        quiet_hours_start: '22:00',
        quiet_hours_end: '08:00',
        unsubscribe_all: false,
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockPrefs,
          error: null,
        }),
      });

      const prefs = await service.getNotificationPreferences('user-1', 'tenant-1');

      expect(prefs).toBeDefined();
      expect(prefs.transactionNotifications).toBe(true);
      expect(prefs.quietHoursStart).toBe('22:00');
    });

    it('should return default preferences if not found', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      });

      const prefs = await service.getNotificationPreferences('user-1', 'tenant-1');

      expect(prefs).toBeDefined();
      expect(prefs.transactionNotifications).toBe(true);
      expect(prefs.unsubscribeAll).toBe(false);
    });
  });

  describe('updateNotificationPreferences', () => {
    it('should update notification preferences', async () => {
      const updates = {
        transactionNotifications: false,
        transactionChannels: ['in-app'],
        quietHoursStart: '20:00',
        quietHoursEnd: '07:00',
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...updates, user_id: 'user-1', tenant_id: 'tenant-1' },
          error: null,
        }),
      });

      const result = await service.updateNotificationPreferences('user-1', 'tenant-1', updates);

      expect(result).toBeDefined();
      expect(mockSupabaseService.supabaseClient.from).toHaveBeenCalledWith('notification_preferences');
    });

    it('should handle update errors', async () => {
      const updates = {
        transactionNotifications: false,
      };

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      });

      const result = await service.updateNotificationPreferences('user-1', 'tenant-1', updates);

      expect(result).toBeDefined();
    });
  });

  describe('getUserNotifications', () => {
    it('should get user notifications with pagination', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          user_id: 'user-1',
          tenant_id: 'tenant-1',
          type: 'transaction',
          title: 'Transaction approved',
          message: 'Your transaction has been approved',
          read: false,
          created_at: new Date().toISOString(),
        },
        {
          id: 'notif-2',
          user_id: 'user-1',
          tenant_id: 'tenant-1',
          type: 'kyc',
          title: 'KYC review complete',
          message: 'Your KYC has been approved',
          read: true,
          created_at: new Date().toISOString(),
        },
      ];

      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockNotifications,
          error: null,
        }),
      });

      const notifs = await service.getUserNotifications('user-1', 'tenant-1', 20, 0);

      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs.length).toBe(2);
    });

    it('should handle empty notifications', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      const notifs = await service.getUserNotifications('user-1', 'tenant-1');

      expect(Array.isArray(notifs)).toBe(true);
      expect(notifs.length).toBe(0);
    });
  });

  describe('getUnreadCount', () => {
    it('should get unread notification count', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          count: 5,
          error: null,
        }),
      });

      const count = await service.getUnreadCount('user-1', 'tenant-1');

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 on error', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          count: null,
          error: { message: 'Error' },
        }),
      });

      const count = await service.getUnreadCount('user-1', 'tenant-1');

      expect(count).toBe(0);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          success: true,
          error: null,
        }),
      });

      const result = await service.markAsRead('notif-1', 'user-1', 'tenant-1');

      expect(typeof result).toBe('boolean');
    });

    it('should return false on error', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          success: false,
          error: { message: 'Error' },
        }),
      });

      const result = await service.markAsRead('notif-1', 'user-1', 'tenant-1');

      expect(result).toBe(false);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: null,
        }),
      });

      await expect(
        service.deleteNotification('notif-1', 'user-1', 'tenant-1'),
      ).resolves.not.toThrow();
    });

    it('should throw on error', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          error: { message: 'Delete failed' },
        }),
      });

      await expect(
        service.deleteNotification('notif-1', 'user-1', 'tenant-1'),
      ).rejects.toThrow();
    });
  });

  describe('Notification preferences defaults', () => {
    it('should provide sensible defaults', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      });

      const prefs = await service.getNotificationPreferences('user-1', 'tenant-1');

      expect(prefs.transactionChannels).toContain('email');
      expect(prefs.transactionChannels).toContain('in-app');
      expect(prefs.systemChannels).toContain('in-app');
    });
  });

  describe('Pagination support', () => {
    it('should support offset and limit parameters', async () => {
      mockSupabaseService.supabaseClient.from = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      });

      await service.getUserNotifications('user-1', 'tenant-1', 50, 100);

      expect(mockSupabaseService.supabaseClient.from).toHaveBeenCalledWith('notifications');
      expect(mockSupabaseService.supabaseClient.from().range).toHaveBeenCalledWith(100, 149);
    });
  });
});
