import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Logger } from '../common/logger/logger.service';

interface AuthPayload {
  sub: string;
  email?: string;
  role?: string;
}

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
@Injectable()
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) { }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (!token) {
        throw new UnauthorizedException('Missing token');
      }

      const payload = await this.jwtService.verifyAsync<AuthPayload>(token, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);

      if (payload.role) {
        client.data.role = payload.role;
        client.join(`role:${payload.role}`);
      }

      this.logger.debug(`Client connected to notifications (user: ${payload.sub})`, NotificationsGateway.name);
    } catch (error) {
      this.logger.warn(`Notifications WS connection rejected: ${(error as Error).message}`, NotificationsGateway.name);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.debug(`Client disconnected from notifications (user: ${client.data?.userId ?? 'unknown'})`, NotificationsGateway.name);
  }

  emitToUser(userId: string, payload: Record<string, unknown>) {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  emitToRole(role: string, payload: Record<string, unknown>) {
    this.server.to(`role:${role}`).emit('notification', payload);
  }

  broadcast(payload: Record<string, unknown>) {
    this.server.emit('notification', payload);
  }

  private extractToken(client: Socket): string | null {
    const { token } = client.handshake.auth ?? {};
    if (token && typeof token === 'string') {
      return token;
    }

    const queryToken = client.handshake.query?.token;
    if (typeof queryToken === 'string') {
      return queryToken;
    }

    return null;
  }
}
