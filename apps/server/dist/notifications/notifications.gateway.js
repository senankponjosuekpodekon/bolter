"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const websockets_1 = require("@nestjs/websockets");
const jwt_1 = require("@nestjs/jwt");
const socket_io_1 = require("socket.io");
const logger_service_1 = require("../common/logger/logger.service");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    constructor(jwtService, configService, logger) {
        this.jwtService = jwtService;
        this.configService = configService;
        this.logger = logger;
    }
    async handleConnection(client) {
        try {
            const token = this.extractToken(client);
            if (!token) {
                throw new common_1.UnauthorizedException('Missing token');
            }
            const payload = await this.jwtService.verifyAsync(token, {
                secret: this.configService.get('jwt.secret'),
            });
            client.data.userId = payload.sub;
            client.join(`user:${payload.sub}`);
            if (payload.role) {
                client.data.role = payload.role;
                client.join(`role:${payload.role}`);
            }
            this.logger.debug(`Client connected to notifications (user: ${payload.sub})`, NotificationsGateway_1.name);
        }
        catch (error) {
            this.logger.warn(`Notifications WS connection rejected: ${error.message}`, NotificationsGateway_1.name);
            client.disconnect(true);
        }
    }
    handleDisconnect(client) {
        this.logger.debug(`Client disconnected from notifications (user: ${client.data?.userId ?? 'unknown'})`, NotificationsGateway_1.name);
    }
    emitToUser(userId, payload) {
        this.server.to(`user:${userId}`).emit('notification', payload);
    }
    emitToRole(role, payload) {
        this.server.to(`role:${role}`).emit('notification', payload);
    }
    broadcast(payload) {
        this.server.emit('notification', payload);
    }
    extractToken(client) {
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
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({ namespace: '/notifications', cors: { origin: '*' } }),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService,
        logger_service_1.Logger])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map