import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from './email.service';

@Injectable()
export class AlertsService {
  constructor(
    private readonly usersService: UsersService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
  ) { }

  async checkAndNotify(userId: string, amount: number, type: string) {
    const user = await this.usersService.findById(userId);
    const threshold = user?.preferences?.alertThreshold ?? 100;
    if (amount >= threshold) {
      // Send notification
      await this.notificationsService.notifyUser(userId, {
        type: 'alert',
        title: 'Alerte transaction',
        message: `Une transaction de ${amount}€ (${type}) a dépassé votre seuil d’alerte.`,
        amount,
        status: 'ALERT',
      });
      // Send email if enabled
      if (user?.preferences?.emailAlerts && user.email) {
        await this.emailService.sendAlertEmail(
          user.email,
          'Alerte transaction bancaire',
          `Une transaction de ${amount}€ (${type}) a dépassé votre seuil d’alerte.`,
        );
      }
    }
  }
}
