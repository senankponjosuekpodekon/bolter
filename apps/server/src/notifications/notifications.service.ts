import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { EmailService } from './email.service';
import { NotificationsGateway } from './notifications.gateway';
import { SupabaseService } from '../supabase/supabase.service';
import { Logger } from '../common/logger/logger.service';

interface UserContact {
  id: string;
  email: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
}

export enum NotificationEvent {
  TRANSACTION_CREATED = 'transaction.created',
  TRANSACTION_UPDATED = 'transaction.updated',
  KYC_DOCUMENT_REVIEWED = 'kyc.document.reviewed',
  KYC_STATUS_CHANGED = 'kyc.status.changed',
  ACCOUNT_CREATED = 'account.created',
  ADMIN_MESSAGE = 'admin.message',
  LOAN_CREATED = 'loan.created',
  LOAN_APPROVED = 'loan.approved',
  LOAN_REJECTED = 'loan.rejected',
  LOAN_REPAYMENT_POSTED = 'loan.repayment.posted',
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    private readonly gateway: NotificationsGateway,
    private readonly supabase: SupabaseService,
    private readonly logger: Logger,
    private readonly config: ConfigService,
  ) { }

  async notifyAccountCreated(userId: string, accountNumber: string): Promise<void> {
    const user = await this.getUserContact(userId);
    if (!user) {
      return;
    }

    const payload = this.buildPayload(NotificationEvent.ACCOUNT_CREATED, {
      title: 'Nouveau compte créé',
      message: `Votre compte ${accountNumber} est maintenant disponible.`,
      userId: user.id,
      accountNumber,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: 'Votre nouveau compte est prêt',
      html: this.renderHtmlTemplate('Nouveau compte disponible', `Bonjour ${this.formatName(user)},<br><br>Votre compte <strong>${accountNumber}</strong> a bien été créé et est désormais actif.`),
      text: `Bonjour ${this.formatName(user)}, votre compte ${accountNumber} a bien été créé.`,
    });
  }

  async notifyAccountDeleted(userId: string, accountNumber: string): Promise<void> {
    const user = await this.getUserContact(userId);
    if (!user) {
      return;
    }

    const payload = this.buildPayload(NotificationEvent.ACCOUNT_CREATED, {
      title: 'Compte supprimé',
      message: `Votre compte ${accountNumber} a été marqué pour suppression. Les données seront conservées 90 jours avant suppression définitive.`,
      userId: user.id,
      accountNumber,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: 'Votre compte a été supprimé',
      html: this.renderHtmlTemplate('Compte supprimé', `Bonjour ${this.formatName(user)},<br><br>Votre compte <strong>${accountNumber}</strong> a bien été marqué pour suppression. Conformément au RGPD, vos données seront conservées 90 jours avant suppression définitive. Vous pouvez annuler cette action en contactant notre support.`),
      text: `Bonjour ${this.formatName(user)}, votre compte ${accountNumber} a bien été marqué pour suppression. Données conservées 90 jours.`,
    });
  }

  async notifyCardCreated(userId: string, cardNumber: string, cardType: string): Promise<void> {
    const user = await this.getUserContact(userId);
    if (!user) {
      return;
    }

    const cardDisplay = `****${cardNumber.slice(-4)}`;
    const payload = this.buildPayload(NotificationEvent.ACCOUNT_CREATED, {
      title: 'Nouvelle carte créée',
      message: `Votre carte ${cardType} ${cardDisplay} est maintenant disponible.`,
      userId: user.id,
      cardNumber: cardDisplay,
      cardType,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: 'Votre nouvelle carte est prête',
      html: this.renderHtmlTemplate('Nouvelle carte disponible', `Bonjour ${this.formatName(user)},<br><br>Votre carte <strong>${cardType}</strong> <strong>${cardDisplay}</strong> a bien été créée et est désormais active.`),
      text: `Bonjour ${this.formatName(user)}, votre carte ${cardType} ${cardDisplay} a bien été créée.`,
    });
  }

  async notifyTransactionCreated(options: {
    transactionId: string;
    userId: string;
    amount: number;
    type: string;
    currency?: string | null;
    description?: string | null;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const amount = this.formatAmount(options.amount, options.currency);
    const payload = this.buildPayload(NotificationEvent.TRANSACTION_CREATED, {
      title: 'Transaction créée',
      message: `Votre transaction ${options.type} de ${amount} est en attente de validation.`,
      transactionId: options.transactionId,
      userId: user.id,
      status: 'PENDING',
      type: options.type,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: 'Transaction en attente de validation',
      html: this.renderHtmlTemplate(
        'Transaction créée',
        `Bonjour ${this.formatName(user)},<br><br>Votre transaction <strong>${options.type}</strong> d'un montant de <strong>${amount}</strong> a été créée et est actuellement en attente de validation.<br><br>Description: ${options.description ?? 'Aucune'}.`
      ),
      text: `Bonjour ${this.formatName(user)}, votre transaction ${options.type} de ${amount} est en attente de validation.`,
    });
  }

  async notifyTransactionUpdated(options: {
    transactionId: string;
    userId: string;
    status: 'APPROVED' | 'REJECTED';
    amount: number;
    type: string;
    currency?: string | null;
    rejectionReason?: string | null;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const amount = this.formatAmount(options.amount, options.currency);
    const isApproved = options.status === 'APPROVED';
    const title = isApproved ? 'Transaction approuvée' : 'Transaction rejetée';
    const message = isApproved
      ? `Votre transaction ${options.type} de ${amount} a été approuvée.`
      : `Votre transaction ${options.type} de ${amount} a été rejetée.${options.rejectionReason ? ` Motif: ${options.rejectionReason}` : ''}`;

    const payload = this.buildPayload(NotificationEvent.TRANSACTION_UPDATED, {
      title,
      message,
      transactionId: options.transactionId,
      userId: user.id,
      status: options.status,
      type: options.type,
      rejectionReason: options.rejectionReason ?? undefined,
    });

    this.gateway.emitToUser(user.id, payload);
    if (!isApproved) {
      this.gateway.emitToRole('ADMIN', payload);
      this.gateway.emitToRole('COMPLIANCE', payload);
    }

    await this.safeSendEmail(user, {
      subject: title,
      html: this.renderHtmlTemplate(title, message.replace(/\n/g, '<br>')),
      text: message,
    });
  }

  async notifyKycDocumentReviewed(options: {
    userId: string;
    documentType: string;
    approved: boolean;
    rejectionReason?: string | null;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const title = options.approved ? 'Document KYC approuvé' : 'Document KYC rejeté';
    const message = options.approved
      ? `Votre document ${options.documentType} a été approuvé.`
      : `Votre document ${options.documentType} a été rejeté.${options.rejectionReason ? ` Motif: ${options.rejectionReason}` : ''}`;

    const payload = this.buildPayload(NotificationEvent.KYC_DOCUMENT_REVIEWED, {
      title,
      message,
      documentType: options.documentType,
      approved: options.approved,
      rejectionReason: options.rejectionReason ?? undefined,
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: title,
      html: this.renderHtmlTemplate(title, message),
      text: message,
    });
  }

  async notifyKycStatusChanged(options: {
    userId: string;
    previousStatus: string | null;
    newStatus: string;
  }): Promise<void> {
    if (options.previousStatus === options.newStatus) {
      return;
    }

    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const payload = this.buildPayload(NotificationEvent.KYC_STATUS_CHANGED, {
      title: 'Statut KYC mis à jour',
      message: `Votre statut KYC est maintenant ${options.newStatus}.`,
      previousStatus: options.previousStatus,
      newStatus: options.newStatus,
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);
    await this.safeSendEmail(user, {
      subject: 'Mise à jour de votre statut KYC',
      html: this.renderHtmlTemplate('Mise à jour KYC', `Votre statut KYC est passé de <strong>${options.previousStatus ?? 'N/A'}</strong> à <strong>${options.newStatus}</strong>.`),
      text: `Votre statut KYC est passé de ${options.previousStatus ?? 'N/A'} à ${options.newStatus}.`,
    });
  }

  async notifyAdmins(message: string, data?: Record<string, unknown>): Promise<void> {
    const payload = this.buildPayload(NotificationEvent.ADMIN_MESSAGE, {
      title: 'Notification administrateur',
      message,
      ...data,
    });
    this.gateway.emitToRole('ADMIN', payload);
    this.gateway.emitToRole('COMPLIANCE', payload);
  }

  async notifyLoanCreated(options: {
    loanId: string;
    userId: string;
    amount: number;
    durationMonths: number;
    monthlyPayment: number;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const title = 'Nouvelle demande de prêt';
    const message = `Votre demande de prêt de ${this.formatAmount(options.amount)} sur ${options.durationMonths} mois est en cours de revue.`;
    const payload = this.buildPayload(NotificationEvent.LOAN_CREATED, {
      title,
      message,
      loanId: options.loanId,
      amount: options.amount,
      durationMonths: options.durationMonths,
      monthlyPayment: options.monthlyPayment,
      status: 'PENDING_REVIEW',
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);
    this.gateway.emitToRole('ADMIN', payload);
    this.gateway.emitToRole('COMPLIANCE', payload);

    await this.safeSendEmail(user, {
      subject: 'Votre demande de prêt est en cours d’analyse',
      html: this.renderHtmlTemplate(title, `${message}<br><br>Mensualité estimée: <strong>${this.formatAmount(options.monthlyPayment)}</strong>.`),
      text: `${message} Mensualité estimée: ${this.formatAmount(options.monthlyPayment)}.`,
    });
  }

  async notifyLoanApproved(options: {
    loanId: string;
    userId: string;
    amount: number;
    durationMonths: number;
    monthlyPayment: number;
    interestRate: number;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const title = 'Prêt approuvé';
    const message = `Votre prêt de ${this.formatAmount(options.amount)} a été approuvé. Mensualité: ${this.formatAmount(options.monthlyPayment)}.`;
    const payload = this.buildPayload(NotificationEvent.LOAN_APPROVED, {
      title,
      message,
      loanId: options.loanId,
      amount: options.amount,
      durationMonths: options.durationMonths,
      monthlyPayment: options.monthlyPayment,
      interestRate: options.interestRate,
      status: 'APPROVED',
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);

    await this.safeSendEmail(user, {
      subject: 'Votre prêt est approuvé',
      html: this.renderHtmlTemplate(
        title,
        `${message}<br><br>Taux appliqué: <strong>${(options.interestRate * 100).toFixed(2)}%</strong>. Les fonds sont disponibles sur votre compte.`,
      ),
      text: `${message} Taux appliqué: ${(options.interestRate * 100).toFixed(2)}%. Les fonds sont disponibles sur votre compte.`,
    });
  }

  async notifyLoanRejected(options: { loanId: string; userId: string; reason: string }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const title = 'Prêt refusé';
    const message = `Votre demande de prêt a été refusée. Motif: ${options.reason}.`;
    const payload = this.buildPayload(NotificationEvent.LOAN_REJECTED, {
      title,
      message,
      loanId: options.loanId,
      reason: options.reason,
      status: 'REJECTED',
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);

    await this.safeSendEmail(user, {
      subject: 'Votre prêt n’a pas été approuvé',
      html: this.renderHtmlTemplate(title, message),
      text: message,
    });
  }

  async notifyLoanRepaymentPosted(options: {
    loanId: string;
    userId: string;
    amount: number;
    remainingBalance: number;
    nextDueDate: string | null;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const title = 'Paiement de prêt enregistré';
    const message = `Nous avons reçu votre paiement de ${this.formatAmount(options.amount)}. Solde restant: ${this.formatAmount(options.remainingBalance)}.`;
    const payload = this.buildPayload(NotificationEvent.LOAN_REPAYMENT_POSTED, {
      title,
      message,
      loanId: options.loanId,
      amount: options.amount,
      remainingBalance: options.remainingBalance,
      nextDueDate: options.nextDueDate,
      status: options.remainingBalance <= 1 ? 'PAID' : 'IN_PROGRESS',
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);

    await this.safeSendEmail(user, {
      subject: 'Paiement de votre prêt confirmé',
      html: this.renderHtmlTemplate(
        title,
        `${message}<br>${options.nextDueDate ? `Prochaine échéance le <strong>${new Date(options.nextDueDate).toLocaleDateString()}</strong>.` : 'Aucune échéance restante.'}`,
      ),
      text: `${message} ${options.nextDueDate ? `Prochaine échéance le ${new Date(options.nextDueDate).toLocaleDateString()}.` : 'Aucune échéance restante.'}`,
    });
  }

  async notifyPasswordReset(options: {
    userId: string;
    resetUrl: string;
  }): Promise<void> {
    const user = await this.getUserContact(options.userId);
    if (!user) {
      return;
    }

    const payload = this.buildPayload(NotificationEvent.PASSWORD_RESET_REQUESTED, {
      title: 'Réinitialisation de mot de passe demandée',
      message: `Une demande de réinitialisation de mot de passe a été initiée. Le lien est valide 1 heure.`,
      userId: user.id,
    });

    this.gateway.emitToUser(user.id, payload);

    await this.safeSendEmail(user, {
      subject: 'Réinitialisation de votre mot de passe',
      html: this.renderHtmlTemplate(
        'Réinitialisation de mot de passe',
        `Bonjour ${this.formatName(user)},<br><br>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour continuer :<br><br><a href="${options.resetUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:5px;">Réinitialiser mon mot de passe</a><br><br>Ce lien expire dans <strong>1 heure</strong>. Si vous n'avez pas fait cette demande, veuillez ignorer cet email.`,
      ),
      text: `Bonjour ${this.formatName(user)}, vous avez demandé la réinitialisation de votre mot de passe. Utilisez ce lien (valide 1 heure) : ${options.resetUrl}`,
    });
  }

  private buildPayload(event: NotificationEvent, data: Record<string, unknown>) {
    const payload = {
      id: randomUUID(),
      event,
      createdAt: new Date().toISOString(),
      ...data,
    };

    // Log notification payload for local inspection in logs/notifications.log
    try {
      // keep log messages small and JSON-friendly
      const p = payload as Record<string, unknown>;
      const userIdValue = p.userId ?? null;
      this.logger.log(`notification: ${JSON.stringify({ id: payload.id, event: payload.event, createdAt: payload.createdAt, userId: userIdValue })}`, NotificationsService.name);
    } catch {
      // ignore logging errors so they don't interfere with notification delivery
    }

    return payload;
  }

  private async getUserContact(userId: string): Promise<UserContact | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Failed to load user contact (${userId}): ${error.message}`, undefined, NotificationsService.name);
      return null;
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      email: data.email,
      firstName: data.first_name,
      lastName: data.last_name,
      role: data.role,
    };
  }

  private async safeSendEmail(user: UserContact, email: { subject: string; html: string; text?: string }): Promise<void> {
    if (!user.email) {
      this.logger.warn(`Skipping email for user ${user.id}: missing email address`, NotificationsService.name);
      return;
    }

    await this.emailService.send({
      to: user.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });
  }

  private renderHtmlTemplate(title: string, body: string): string {
    const appUrl = this.config.get<string>('APP_URL') || 'https://banking-platform.test';
    return `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #111827;">
        <h2 style="color: #1f2937;">${title}</h2>
        <p style="line-height: 1.6;">${body}</p>
        <p style="line-height: 1.6;">Vous pouvez suivre l'état de vos opérations depuis votre espace client : <a href="${appUrl}" style="color: #2563eb;">${appUrl}</a>.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
      </div>
    `;
  }

  private formatAmount(value: number, currency?: string | null) {
    const currencyCode = currency || 'EUR';
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currencyCode,
      }).format(Number(value));
    } catch (error) {
      this.logger.warn(`Unable to format amount ${value} ${currencyCode}: ${(error as Error).message}`, NotificationsService.name);
      return `${value} ${currencyCode}`;
    }
  }

  private formatName(user: UserContact): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    if (!parts.length) {
      return user.email ?? 'client';
    }
    return parts.join(' ');
  }

  /**
   * Get notification preferences for user (Sprint III)
   */
  async getNotificationPreferences(userId: string, tenantId: string): Promise<Record<string, any>> {
    const { data, error } = await this.supabase.supabaseClient
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !data) {
      return this.getDefaultPreferences();
    }

    return {
      transactionNotifications: data.transaction_notifications ?? true,
      transactionChannels: data.transaction_channels || ['email', 'in-app'],
      kycNotifications: data.kyc_notifications ?? true,
      kycChannels: data.kyc_channels || ['email', 'in-app'],
      loanNotifications: data.loan_notifications ?? true,
      loanChannels: data.loan_channels || ['email', 'in-app'],
      systemNotifications: data.system_notifications ?? true,
      systemChannels: data.system_channels || ['in-app'],
      quietHoursStart: data.quiet_hours_start,
      quietHoursEnd: data.quiet_hours_end,
      unsubscribeAll: data.unsubscribe_all ?? false,
    };
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    tenantId: string,
    preferences: Record<string, any>,
  ): Promise<Record<string, any>> {
    const { data, error } = await this.supabase.supabaseClient
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        tenant_id: tenantId,
        transaction_notifications: preferences.transactionNotifications,
        transaction_channels: preferences.transactionChannels,
        kyc_notifications: preferences.kycNotifications,
        kyc_channels: preferences.kycChannels,
        loan_notifications: preferences.loanNotifications,
        loan_channels: preferences.loanChannels,
        system_notifications: preferences.systemNotifications,
        system_channels: preferences.systemChannels,
        quiet_hours_start: preferences.quietHoursStart,
        quiet_hours_end: preferences.quietHoursEnd,
        unsubscribe_all: preferences.unsubscribeAll,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to update notification preferences: ${error.message}`, NotificationsService.name);
      return this.getDefaultPreferences();
    }

    return this.getNotificationPreferences(userId, tenantId);
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): Record<string, any> {
    return {
      transactionNotifications: true,
      transactionChannels: ['email', 'in-app'],
      kycNotifications: true,
      kycChannels: ['email', 'in-app'],
      loanNotifications: true,
      loanChannels: ['email', 'in-app'],
      systemNotifications: true,
      systemChannels: ['in-app'],
      quietHoursStart: undefined,
      quietHoursEnd: undefined,
      unsubscribeAll: false,
    };
  }

  /**
   * Get user notifications (Sprint III - pagination support)
   */
  async getUserNotifications(
    userId: string,
    tenantId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<Record<string, any>[]> {
    const { data, error } = await this.supabase.supabaseClient
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`Failed to fetch notifications: ${error.message}`, NotificationsService.name);
      return [];
    }

    return data || [];
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string, tenantId: string): Promise<number> {
    const { count, error } = await this.supabase.supabaseClient
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .eq('read', false);

    if (error) {
      this.logger.error(`Failed to get unread count: ${error.message}`, NotificationsService.name);
      return 0;
    }

    return count || 0;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string, tenantId: string): Promise<boolean> {
    const { error } = await this.supabase.supabaseClient
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error(`Failed to mark notification as read: ${error.message}`, NotificationsService.name);
      return false;
    }

    return true;
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string, tenantId: string): Promise<boolean> {
    const { error } = await this.supabase.supabaseClient
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (error) {
      this.logger.error(`Failed to delete notification: ${error.message}`, NotificationsService.name);
      return false;
    }

    return true;
  }
}
