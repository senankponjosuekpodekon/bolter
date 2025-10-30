import { ConfigService } from '@nestjs/config';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Logger } from '../common/logger/logger.service';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    private readonly configService;
    private readonly logger;
    server: Server;
    constructor(jwtService: JwtService, configService: ConfigService, logger: Logger);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    emitToUser(userId: string, payload: Record<string, any>): void;
    emitToRole(role: string, payload: Record<string, any>): void;
    broadcast(payload: Record<string, any>): void;
    private extractToken;
}
