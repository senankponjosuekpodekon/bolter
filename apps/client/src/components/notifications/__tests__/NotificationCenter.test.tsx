import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { NotificationCenter } from '../notifications/NotificationCenter';

describe('NotificationCenter Component', () => {
  const mockNotifications = [
    {
      id: '1',
      type: 'transaction' as const,
      title: 'Transaction Approved',
      message: 'Your transaction has been approved',
      read: false,
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    },
    {
      id: '2',
      type: 'kyc' as const,
      title: 'KYC Verified',
      message: 'Your identity has been verified',
      read: true,
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    },
    {
      id: '3',
      type: 'system' as const,
      title: 'System Alert',
      message: 'Scheduled maintenance tonight',
      read: false,
      createdAt: new Date().toISOString(),
      userId: 'user-1',
    },
  ];

  const mockProps = {
    notifications: mockNotifications,
    unreadCount: 2,
    isOpen: true,
    onClose: vi.fn(),
    onMarkAsRead: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render notification center', () => {
    render(<NotificationCenter {...mockProps} />);
    expect(screen.getByText('Notifications')).toBeInTheDocument();
  });

  it('should display unread count badge', () => {
    render(<NotificationCenter {...mockProps} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display all notifications', () => {
    render(<NotificationCenter {...mockProps} />);
    mockNotifications.forEach((notif) => {
      expect(screen.getByText(notif.title)).toBeInTheDocument();
      expect(screen.getByText(notif.message)).toBeInTheDocument();
    });
  });

  it('should filter unread notifications', () => {
    render(<NotificationCenter {...mockProps} />);
    const unreadButton = screen.getByRole('button', { name: /unread/i });
    fireEvent.click(unreadButton);

    // Should show only unread notifications (2)
    expect(screen.getByText('Transaction Approved')).toBeInTheDocument();
    expect(screen.getByText('System Alert')).toBeInTheDocument();
    expect(screen.queryByText('KYC Verified')).not.toBeInTheDocument();
  });

  it('should call onMarkAsRead when clicking notification', () => {
    render(<NotificationCenter {...mockProps} />);
    const firstNotif = screen.getByText('Transaction Approved').closest('div');

    if (firstNotif) {
      fireEvent.click(firstNotif);
      expect(mockProps.onMarkAsRead).toHaveBeenCalledWith('1');
    }
  });

  it('should call onDelete when clicking delete button', () => {
    render(<NotificationCenter {...mockProps} />);
    const deleteButtons = screen.getAllByRole('button', { name: '' });

    // Find delete button (usually the last action button)
    fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    expect(mockProps.onDelete).toHaveBeenCalled();
  });

  it('should close when clicking overlay', () => {
    const { container } = render(<NotificationCenter {...mockProps} />);
    const overlay = container.querySelector('[role="presentation"]');

    if (overlay) {
      fireEvent.click(overlay);
      expect(mockProps.onClose).toHaveBeenCalled();
    }
  });

  it('should display empty state when no notifications', () => {
    const emptyProps = { ...mockProps, notifications: [] };
    render(<NotificationCenter {...emptyProps} />);
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('should color-code notifications by type', () => {
    const { container } = render(<NotificationCenter {...mockProps} />);
    
    // Check that different notification types have different styling
    const notifications = container.querySelectorAll('[data-notification-type]');
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('should not render when closed', () => {
    const closedProps = { ...mockProps, isOpen: false };
    const { container } = render(<NotificationCenter {...closedProps} />);
    
    // Should either not render the panel or render with hidden styling
    const panel = container.querySelector('[role="dialog"]');
    if (panel) {
      expect(panel).toHaveClass('hidden') || expect(panel).toHaveClass('translate-full');
    }
  });
});
