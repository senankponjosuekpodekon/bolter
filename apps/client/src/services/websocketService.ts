import { io, Socket } from 'socket.io-client';

export interface NotificationPayload {
  id?: string;
  type?: string;
  message?: string;
  title?: string;
  event?: string;
  createdAt?: string;
  [key: string]: unknown;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners: ((payload: NotificationPayload) => void)[] = [];

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    // In development, use same origin (Vite proxy handles WebSocket upgrade)
    // This avoids mixed content issues with ngrok HTTPS → HTTP
    const isDev = import.meta.env.DEV;
    const API_BASE_URL = isDev
      ? window.location.origin  // Same origin for proxy
      : (import.meta.env.VITE_API_BASE_URL || window.location.origin);

    this.socket = io(`${API_BASE_URL}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
    });

    this.socket.on('notification', (payload: NotificationPayload) => {
      this.listeners.forEach((listener) => listener(payload));
    });

    this.socket.on('disconnect', () => {
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
    });
  }

  onNotification(callback: (payload: NotificationPayload) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners = [];
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
