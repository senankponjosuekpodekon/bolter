import { io, Socket } from 'socket.io-client';

class WebSocketService {
  private socket: Socket | null = null;

  connect(userId: string) {
    if (!this.socket) {
      this.socket = io('http://localhost:3000', {
        transports: ['websocket'],
      });
      this.socket.emit('join', userId);
    }
  }

  onNotification(callback: (payload: { id: string; type: string; message: string; createdAt?: string;[key: string]: unknown }) => void) {
    this.socket?.on('notification', callback);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const websocketService = new WebSocketService();
