import { Injectable } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(private readonly gateway: NotificationsGateway) { }

  notifyUser(userId: string, payload: any) {
    this.gateway.sendNotificationToUser(userId, payload);
  }

  broadcast(payload: any) {
    this.gateway.broadcastNotification(payload);
  }
}
