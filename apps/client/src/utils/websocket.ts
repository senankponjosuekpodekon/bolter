import { Socket, io } from 'socket.io-client';

type SocketEventPayload = Record<string, unknown>;

/**
 * WebSocket client configuration and singleton
 * Manages socket.io connection with automatic reconnection
 */
class WebSocketClient {
  private static instance: WebSocketClient;
  private socket: Socket | null = null;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  /**
   * Initialize WebSocket connection
   */
  public initialize(token?: string): Socket {
    if (this.isInitialized && this.socket?.connected) {
      return this.socket;
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const authToken = token || localStorage.getItem('authToken');

    this.socket = io(apiUrl, {
      auth: {
        token: authToken,
      },
      reconnection: true,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ['websocket', 'polling'],
    });

    this.attachEventListeners();
    this.isInitialized = true;

    return this.socket;
  }

  /**
   * Attach global event listeners
   */
  private attachEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('[WebSocket] Connected successfully');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emitEvent('socket:connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.emitEvent('socket:disconnected', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      this.emitEvent('socket:error', { error });
    });

    this.socket.on('error', (error) => {
      console.error('[WebSocket] Socket error:', error);
      this.emitEvent('socket:error', { error });
    });
  }

  /**
   * Get socket instance
   */
  public getSocket(): Socket {
    if (!this.socket) {
      return this.initialize();
    }
    return this.socket;
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Emit custom event
   */
  private emitEvent(eventName: string, data?: unknown): void {
    if (this.socket) {
      this.socket.emit(eventName, data);
    }
  }

  /**
   * Subscribe to event
   */
  public on(eventName: string, callback: (data: SocketEventPayload) => void): void {
    if (this.socket) {
      this.socket.on(eventName, callback);
    }
  }

  /**
   * Subscribe to event once
   */
  public once(eventName: string, callback: (data: SocketEventPayload) => void): void {
    if (this.socket) {
      this.socket.once(eventName, callback);
    }
  }

  /**
   * Unsubscribe from event
   */
  public off(eventName: string, callback?: (data: SocketEventPayload) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.off(eventName, callback);
      } else {
        this.socket.off(eventName);
      }
    }
  }

  /**
   * Emit event to server
   */
  public emit(eventName: string, data?: unknown, callback?: (response: unknown) => void): void {
    if (this.socket) {
      if (callback) {
        this.socket.emit(eventName, data, callback);
      } else {
        this.socket.emit(eventName, data);
      }
    }
  }

  /**
   * Connect socket
   */
  public connect(): void {
    if (this.socket && !this.socket.connected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect socket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  /**
   * Reconnect socket
   */
  public reconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      setTimeout(() => {
        this.socket?.connect();
      }, 1000);
    }
  }

  /**
   * Join a room (for tenant isolation)
   */
  public joinRoom(roomName: string): void {
    if (this.socket) {
      this.socket.emit('room:join', { room: roomName });
    }
  }

  /**
   * Leave a room
   */
  public leaveRoom(roomName: string): void {
    if (this.socket) {
      this.socket.emit('room:leave', { room: roomName });
    }
  }
}

export default WebSocketClient.getInstance();

const extractField = (payload: SocketEventPayload, key: string): string => {
  const value = payload[key];
  return typeof value === 'string' || typeof value === 'number' ? String(value) : 'unknown';
};

/**
 * Event listeners configuration
 * Setup all application-wide event handlers
 */
export const setupWebSocketListeners = (socket: Socket): void => {
  // Transaction events
  socket.on('transaction:created', (data: SocketEventPayload) => {
    console.log('[Event] Transaction created:', extractField(data, 'id'));
  });

  socket.on('transaction:updated', (data: SocketEventPayload) => {
    console.log('[Event] Transaction updated:', extractField(data, 'id'));
  });

  socket.on('transaction:approved', (data: SocketEventPayload) => {
    console.log('[Event] Transaction approved:', extractField(data, 'id'));
  });

  socket.on('transaction:rejected', (data: SocketEventPayload) => {
    console.log('[Event] Transaction rejected:', extractField(data, 'id'));
  });

  // KYC events
  socket.on('kyc:submitted', (data: SocketEventPayload) => {
    console.log('[Event] KYC submitted:', extractField(data, 'userId'));
  });

  socket.on('kyc:approved', (data: SocketEventPayload) => {
    console.log('[Event] KYC approved:', extractField(data, 'userId'));
  });

  socket.on('kyc:rejected', (data: SocketEventPayload) => {
    console.log('[Event] KYC rejected:', extractField(data, 'userId'));
  });

  // Loan events
  socket.on('loan:created', (data: SocketEventPayload) => {
    console.log('[Event] Loan created:', extractField(data, 'id'));
  });

  socket.on('loan:approved', (data: SocketEventPayload) => {
    console.log('[Event] Loan approved:', extractField(data, 'id'));
  });

  socket.on('loan:rejected', (data: SocketEventPayload) => {
    console.log('[Event] Loan rejected:', extractField(data, 'id'));
  });

  // System events
  socket.on('system:alert', (data: SocketEventPayload) => {
    console.log('[Event] System alert:', extractField(data, 'message'));
  });

  socket.on('system:maintenance', (data: SocketEventPayload) => {
    console.log('[Event] System maintenance:', extractField(data, 'message'));
  });

  // Report events
  socket.on('report:ready', (data: SocketEventPayload) => {
    console.log('[Event] Report ready:', extractField(data, 'reportId'));
  });

  socket.on('report:error', (data: SocketEventPayload) => {
    console.log('[Event] Report error:', extractField(data, 'message'));
  });

  // Bulk operation events
  socket.on('bulk:progress', (data: SocketEventPayload) => {
    console.log('[Event] Bulk operation progress:', extractField(data, 'progress'));
  });

  socket.on('bulk:completed', (data: SocketEventPayload) => {
    console.log('[Event] Bulk operation completed:', extractField(data, 'operationId'));
  });

  // User events
  socket.on('user:online', (data: SocketEventPayload) => {
    console.log('[Event] User online:', extractField(data, 'userId'));
  });

  socket.on('user:offline', (data: SocketEventPayload) => {
    console.log('[Event] User offline:', extractField(data, 'userId'));
  });

  // Presence events
  socket.on('presence:update', (data: SocketEventPayload) => {
    console.log('[Event] Presence updated:', data);
  });
};

/**
 * Register event handler with type safety
 */
export const registerEventHandler = (
  eventName: string,
  handler: (data: SocketEventPayload) => void
): (() => void) => {
  const socket = WebSocketClient.getInstance().getSocket();
  socket.on(eventName, handler);

  // Return unsubscribe function
  return () => {
    socket.off(eventName, handler);
  };
};
