import { io, Socket } from 'socket.io-client';
import { NotificationPayload } from '../types/notification';

class WebSocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (!this.socket) {
      const host = window.location.hostname;
      const defaultBase = `http://${host}:3000`;
      const base = import.meta.env?.VITE_API_BASE_URL || defaultBase;
      this.socket = io(base, {
        transports: ['websocket'],
      });
      this.socket.emit('join', userId);
    }
  }

  onNotification(callback: (payload: NotificationPayload) => void) {
    this.socket?.on('notification', callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const websocketService = new WebSocketService();
