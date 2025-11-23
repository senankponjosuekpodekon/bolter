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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = exports.NotificationEvent = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const email_service_1 = require("./email.service");
const notifications_gateway_1 = require("./notifications.gateway");
const supabase_service_1 = require("../supabase/supabase.service");
const logger_service_1 = require("../common/logger/logger.service");
var NotificationEvent;
(function (NotificationEvent) {
    NotificationEvent["TRANSACTION_CREATED"] = "transaction.created";
    NotificationEvent["TRANSACTION_UPDATED"] = "transaction.updated";
    NotificationEvent["KYC_DOCUMENT_REVIEWED"] = "kyc.document.reviewed";
    NotificationEvent["KYC_STATUS_CHANGED"] = "kyc.status.changed";
    NotificationEvent["ACCOUNT_CREATED"] = "account.created";
    NotificationEvent["ADMIN_MESSAGE"] = "admin.message";
    NotificationEvent["LOAN_CREATED"] = "loan.created";
    NotificationEvent["LOAN_APPROVED"] = "loan.approved";
    NotificationEvent["LOAN_REJECTED"] = "loan.rejected";
    NotificationEvent["LOAN_REPAYMENT_POSTED"] = "loan.repayment.posted";
})(NotificationEvent || (exports.NotificationEvent = NotificationEvent = {}));
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(emailService, gateway, supabase, logger, config) {
        this.emailService = emailService;
        this.gateway = gateway;
        this.supabase = supabase;
        this.logger = logger;
        this.config = config;
    }
    async notifyAccountCreated(userId, accountNumber) {
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
    async notifyTransactionCreated(options) {
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
            html: this.renderHtmlTemplate('Transaction créée', `Bonjour ${this.formatName(user)},<br><br>Votre transaction <strong>${options.type}</strong> d'un montant de <strong>${amount}</strong> a été créée et est actuellement en attente de validation.<br><br>Description: ${options.description ?? 'Aucune'}.`),
            text: `Bonjour ${this.formatName(user)}, votre transaction ${options.type} de ${amount} est en attente de validation.`,
        });
    }
    async notifyTransactionUpdated(options) {
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
    async notifyKycDocumentReviewed(options) {
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
    async notifyKycStatusChanged(options) {
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
    async notifyAdmins(message, data) {
        const payload = this.buildPayload(NotificationEvent.ADMIN_MESSAGE, {
            title: 'Notification administrateur',
            message,
            ...data,
        });
        this.gateway.emitToRole('ADMIN', payload);
        this.gateway.emitToRole('COMPLIANCE', payload);
    }
    async notifyLoanCreated(options) {
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
    async notifyLoanApproved(options) {
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
            html: this.renderHtmlTemplate(title, `${message}<br><br>Taux appliqué: <strong>${(options.interestRate * 100).toFixed(2)}%</strong>. Les fonds sont disponibles sur votre compte.`),
            text: `${message} Taux appliqué: ${(options.interestRate * 100).toFixed(2)}%. Les fonds sont disponibles sur votre compte.`,
        });
    }
    async notifyLoanRejected(options) {
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
    async notifyLoanRepaymentPosted(options) {
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
            html: this.renderHtmlTemplate(title, `${message}<br>${options.nextDueDate ? `Prochaine échéance le <strong>${new Date(options.nextDueDate).toLocaleDateString()}</strong>.` : 'Aucune échéance restante.'}`),
            text: `${message} ${options.nextDueDate ? `Prochaine échéance le ${new Date(options.nextDueDate).toLocaleDateString()}.` : 'Aucune échéance restante.'}`,
        });
    }
    buildPayload(event, data) {
        const payload = {
            id: (0, crypto_1.randomUUID)(),
            event,
            createdAt: new Date().toISOString(),
            ...data,
        };
        try {
            const p = payload;
            const userIdValue = p.userId ?? null;
            this.logger.log(`notification: ${JSON.stringify({ id: payload.id, event: payload.event, createdAt: payload.createdAt, userId: userIdValue })}`, NotificationsService_1.name);
        }
        catch {
        }
        return payload;
    }
    async getUserContact(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('id, email, first_name, last_name, role')
            .eq('id', userId)
            .maybeSingle();
        if (error) {
            this.logger.error(`Failed to load user contact (${userId}): ${error.message}`, undefined, NotificationsService_1.name);
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
    async safeSendEmail(user, email) {
        if (!user.email) {
            this.logger.warn(`Skipping email for user ${user.id}: missing email address`, NotificationsService_1.name);
            return;
        }
        await this.emailService.send({
            to: user.email,
            subject: email.subject,
            html: email.html,
            text: email.text,
        });
    }
    renderHtmlTemplate(title, body) {
        const appUrl = this.config.get('APP_URL') || 'https://banking-platform.test';
        return `
      <div style="font-family: 'Segoe UI', Tahoma, sans-serif; color: #111827;">
        <h2 style="color: #1f2937;">${title}</h2>
        <p style="line-height: 1.6;">${body}</p>
        <p style="line-height: 1.6;">Vous pouvez suivre l'état de vos opérations depuis votre espace client : <a href="${appUrl}" style="color: #2563eb;">${appUrl}</a>.</p>
        <p style="margin-top: 24px; font-size: 12px; color: #6b7280;">Cet email est généré automatiquement, merci de ne pas y répondre.</p>
      </div>
    `;
    }
    formatAmount(value, currency) {
        const currencyCode = currency || 'EUR';
        try {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: currencyCode,
            }).format(Number(value));
        }
        catch (error) {
            this.logger.warn(`Unable to format amount ${value} ${currencyCode}: ${error.message}`, NotificationsService_1.name);
            return `${value} ${currencyCode}`;
        }
    }
    formatName(user) {
        const parts = [user.firstName, user.lastName].filter(Boolean);
        if (!parts.length) {
            return user.email ?? 'client';
        }
        return parts.join(' ');
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        notifications_gateway_1.NotificationsGateway,
        supabase_service_1.SupabaseService,
        logger_service_1.Logger,
        config_1.ConfigService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map