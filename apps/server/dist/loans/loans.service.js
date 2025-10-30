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
var LoansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoansService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const audit_logs_service_1 = require("../audit-logs/audit-logs.service");
const notifications_service_1 = require("../notifications/notifications.service");
const accounts_service_1 = require("../accounts/accounts.service");
const loan_constants_1 = require("./loan.constants");
let LoansService = LoansService_1 = class LoansService {
    constructor(supabase, auditLogsService, notificationsService, accountsService) {
        this.supabase = supabase;
        this.auditLogsService = auditLogsService;
        this.notificationsService = notificationsService;
        this.accountsService = accountsService;
        this.logger = new common_1.Logger(LoansService_1.name);
    }
    async createLoan(userId, dto) {
        await this.ensureUserEligible(userId);
        const riskScore = await this.calculateRiskScore(userId, dto.amount, dto.durationMonths, dto.monthlyIncome);
        const interestRate = this.determineInterestRate(riskScore, dto.durationMonths);
        const simulation = this.calculateSimulation(dto.amount, dto.durationMonths, interestRate);
        const sanitizedDocuments = this.sanitizeDocuments(dto.documents ?? []);
        const client = this.supabase.getAdminClient();
        const insertPayload = {
            user_id: userId,
            amount: dto.amount,
            duration_months: dto.durationMonths,
            purpose: dto.purpose,
            monthly_income: dto.monthlyIncome,
            employer: dto.employer ?? null,
            notes: dto.notes ?? null,
            status: loan_constants_1.LOAN_STATUSES.PENDING_REVIEW,
            interest_rate: interestRate,
            monthly_payment: simulation.monthlyPayment,
            total_interest: simulation.totalInterest,
            total_cost: simulation.totalCost,
            amortization_schedule: simulation.schedule,
            supporting_documents: sanitizedDocuments,
            risk_score: riskScore,
            outstanding_balance: simulation.totalCost,
        };
        const { data, error } = await client.from('loans').insert(insertPayload).select().single();
        if (error) {
            this.logSupabaseError('createLoan.insert', error, {
                userId,
                amount: dto.amount,
                durationMonths: dto.durationMonths,
            });
            throw new common_1.BadRequestException(`Unable to create loan request: ${error.message}`);
        }
        await this.auditLogsService.log({
            action: 'LOAN_CREATED',
            resourceType: 'loan',
            resourceId: data.id,
            userId,
            performedBy: userId,
            metadata: {
                changes: insertPayload,
            },
        });
        await this.notificationsService.notifyLoanCreated({
            loanId: data.id,
            userId,
            amount: dto.amount,
            durationMonths: dto.durationMonths,
            monthlyPayment: simulation.monthlyPayment,
        });
        return {
            ...data,
            simulation,
        };
    }
    async findLoansForUser(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('loans')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) {
            this.logSupabaseError('findLoansForUser.select', error, { userId });
            throw new common_1.BadRequestException(`Unable to fetch loans: ${error.message}`);
        }
        return data ?? [];
    }
    async findLoans(query, currentUser) {
        const scope = query.scope;
        const isAdmin = ['ADMIN', 'COMPLIANCE'].includes(currentUser.role);
        if (scope === 'admin' && !isAdmin) {
            throw new common_1.ForbiddenException('Admin privileges required to view all loans');
        }
        const client = this.supabase.getAdminClient();
        const take = query.take ? parseInt(query.take, 10) : 25;
        const skip = query.skip ? parseInt(query.skip, 10) : 0;
        let request = client
            .from('loans')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });
        if (!isAdmin || scope !== 'admin') {
            request = request.eq('user_id', currentUser.id);
        }
        if (query.status) {
            request = request.eq('status', query.status);
        }
        if (isAdmin && query.userId) {
            request = request.eq('user_id', query.userId);
        }
        if (isAdmin && query.search) {
            const pattern = `%${query.search}%`;
            request = request.or(`purpose.ilike.${pattern},notes.ilike.${pattern}`);
        }
        const to = take ? skip + take - 1 : skip + 24;
        const { data, error, count } = await request.range(skip, to);
        if (error) {
            this.logSupabaseError('findLoans.select', error, {
                scope,
                actorId: currentUser.id,
                isAdmin,
                skip,
                take,
                status: query.status,
                userId: query.userId,
                search: query.search,
            });
            throw new common_1.BadRequestException(`Unable to fetch loans: ${error.message}`);
        }
        const result = (data ?? []);
        if (result.length && isAdmin && scope === 'admin') {
            const uniqueUserIds = Array.from(new Set(result.map((item) => item.user_id).filter(Boolean)));
            if (uniqueUserIds.length) {
                const { data: users, error: usersError } = await client
                    .from('users')
                    .select('id, email, first_name, last_name, kyc_status')
                    .in('id', uniqueUserIds);
                if (usersError) {
                    this.logSupabaseError('findLoans.fetchUsers', usersError, { userIds: uniqueUserIds.length });
                    throw new common_1.BadRequestException(`Unable to fetch loan applicants: ${usersError.message}`);
                }
                const userMap = new Map((users ?? []).map((user) => [user.id, user]));
                result.forEach((loan) => {
                    const relatedUser = userMap.get(loan.user_id);
                    if (relatedUser) {
                        loan.user = relatedUser;
                    }
                });
            }
        }
        return {
            data: result,
            total: typeof count === 'number' ? count : result.length,
        };
    }
    async findLoanById(loanId, currentUser) {
        const loan = await this.getLoanOrThrow(loanId);
        if (loan.user_id !== currentUser.id && !['ADMIN', 'COMPLIANCE'].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('You are not allowed to view this loan');
        }
        return loan;
    }
    async approveLoan(adminId, loanId, dto) {
        const loan = await this.getLoanOrThrow(loanId);
        if (loan.status !== loan_constants_1.LOAN_STATUSES.PENDING_REVIEW) {
            throw new common_1.BadRequestException('Only loans pending review can be approved');
        }
        const approvedAmount = dto.approvedAmount ?? loan.amount;
        if (approvedAmount <= 0) {
            throw new common_1.BadRequestException('Approved amount must be greater than zero');
        }
        const interestRate = this.normalizeInterestRate(dto.interestRate ?? loan.interest_rate ?? loan_constants_1.DEFAULT_INTEREST_RATE);
        const simulation = this.calculateSimulation(approvedAmount, loan.duration_months, interestRate);
        const disbursementAccountId = dto.disbursementAccountId || (await this.resolveDefaultAccount(loan.user_id));
        const updatePayload = {
            status: loan_constants_1.LOAN_STATUSES.IN_PROGRESS,
            interest_rate: interestRate,
            monthly_payment: simulation.monthlyPayment,
            total_interest: simulation.totalInterest,
            total_cost: simulation.totalCost,
            amortization_schedule: simulation.schedule,
            approved_by: adminId,
            approved_at: new Date().toISOString(),
            disbursed_account_id: disbursementAccountId,
            disbursed_at: new Date().toISOString(),
            outstanding_balance: simulation.totalCost,
            next_payment_due_at: simulation.schedule[0]?.dueDate ?? null,
            approved_amount: approvedAmount,
            approval_notes: dto.approvalNotes ?? null,
        };
        const { error, data } = await this.supabase
            .getAdminClient()
            .from('loans')
            .update(updatePayload)
            .eq('id', loanId)
            .select()
            .single();
        if (error) {
            this.logSupabaseError('approveLoan.update', error, { loanId, adminId });
            throw new common_1.BadRequestException(`Unable to approve loan: ${error.message}`);
        }
        await this.disburseLoan(loan.user_id, disbursementAccountId, approvedAmount);
        await this.auditLogsService.log({
            action: 'LOAN_APPROVED',
            resourceType: 'loan',
            resourceId: loanId,
            userId: loan.user_id,
            performedBy: adminId,
            metadata: {
                changes: {
                    ...updatePayload,
                    amount: approvedAmount,
                },
            },
        });
        await this.notificationsService.notifyLoanApproved({
            loanId,
            userId: loan.user_id,
            amount: approvedAmount,
            durationMonths: loan.duration_months,
            monthlyPayment: simulation.monthlyPayment,
            interestRate,
        });
        return data;
    }
    async rejectLoan(adminId, loanId, dto) {
        const loan = await this.getLoanOrThrow(loanId);
        if (loan.status !== loan_constants_1.LOAN_STATUSES.PENDING_REVIEW) {
            throw new common_1.BadRequestException('Only loans pending review can be rejected');
        }
        const updatePayload = {
            status: loan_constants_1.LOAN_STATUSES.REJECTED,
            rejection_reason: dto.reason,
            approved_by: adminId,
            approved_at: new Date().toISOString(),
        };
        const { error, data } = await this.supabase
            .getAdminClient()
            .from('loans')
            .update(updatePayload)
            .eq('id', loanId)
            .select()
            .single();
        if (error) {
            this.logSupabaseError('rejectLoan.update', error, { loanId, adminId });
            throw new common_1.BadRequestException(`Unable to reject loan: ${error.message}`);
        }
        await this.auditLogsService.log({
            action: 'LOAN_REJECTED',
            resourceType: 'loan',
            resourceId: loanId,
            userId: loan.user_id,
            performedBy: adminId,
            metadata: {
                changes: updatePayload,
            },
        });
        await this.notificationsService.notifyLoanRejected({
            loanId,
            userId: loan.user_id,
            reason: dto.reason,
        });
        return data;
    }
    async recordRepayment(userId, loanId, dto) {
        const loan = await this.getLoanOrThrow(loanId);
        if (loan.user_id !== userId) {
            throw new common_1.ForbiddenException('You can only repay your own loans');
        }
        const repayableStatuses = [loan_constants_1.LOAN_STATUSES.IN_PROGRESS, loan_constants_1.LOAN_STATUSES.LATE_PAYMENT];
        if (!repayableStatuses.includes(loan.status)) {
            throw new common_1.BadRequestException('Loan is not eligible for repayments');
        }
        const paidAt = dto.paidAt ? new Date(dto.paidAt).toISOString() : new Date().toISOString();
        const amount = dto.amount;
        if (amount <= 0) {
            throw new common_1.BadRequestException('Repayment amount must be greater than zero');
        }
        const currentOutstanding = loan.outstanding_balance ?? loan.total_cost ?? loan.amount;
        const remainingBalance = Math.max(0, currentOutstanding - amount - (dto.penaltyFee ?? 0));
        const nextDueDate = this.computeNextDueDate(loan, paidAt);
        const newStatus = remainingBalance <= 1 ? loan_constants_1.LOAN_STATUSES.PAID : this.deriveStatusFromDueDate(nextDueDate, remainingBalance);
        const repaymentPayload = {
            loan_id: loanId,
            amount,
            penalty_fee: dto.penaltyFee ?? 0,
            paid_at: paidAt,
            due_date: dto.dueDate ?? null,
            reference: dto.reference ?? null,
            status: 'POSTED',
        };
        const client = this.supabase.getAdminClient();
        const { error: repaymentError, data: repayment } = await client
            .from('loan_repayments')
            .insert(repaymentPayload)
            .select()
            .single();
        if (repaymentError) {
            this.logSupabaseError('recordRepayment.insert', repaymentError, { loanId, userId });
            throw new common_1.BadRequestException(`Unable to persist repayment: ${repaymentError.message}`);
        }
        const { error: updateError, data: updatedLoan } = await client
            .from('loans')
            .update({
            outstanding_balance: remainingBalance,
            next_payment_due_at: nextDueDate,
            status: newStatus,
        })
            .eq('id', loanId)
            .select()
            .single();
        if (updateError) {
            this.logSupabaseError('recordRepayment.updateLoan', updateError, { loanId, userId });
            throw new common_1.BadRequestException(`Unable to update loan balance: ${updateError.message}`);
        }
        await this.auditLogsService.log({
            action: 'LOAN_REPAYMENT_POSTED',
            resourceType: 'loan',
            resourceId: loanId,
            userId,
            performedBy: userId,
            metadata: {
                repayment: repaymentPayload,
                remainingBalance,
            },
        });
        await this.notificationsService.notifyLoanRepaymentPosted({
            loanId,
            userId,
            amount,
            remainingBalance,
            nextDueDate,
        });
        return {
            loan: updatedLoan,
            repayment,
        };
    }
    async getRepayments(loanId, currentUser) {
        const loan = await this.getLoanOrThrow(loanId);
        if (loan.user_id !== currentUser.id && !['ADMIN', 'COMPLIANCE'].includes(currentUser.role)) {
            throw new common_1.ForbiddenException('You are not allowed to view this loan');
        }
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('loan_repayments')
            .select('*')
            .eq('loan_id', loanId)
            .order('paid_at', { ascending: false });
        if (error) {
            this.logSupabaseError('getRepayments.select', error, { loanId, requesterId: currentUser.id });
            throw new common_1.BadRequestException(`Unable to fetch repayments: ${error.message}`);
        }
        return data ?? [];
    }
    calculateSimulation(amount, durationMonths, interestRate) {
        const monthlyRate = interestRate / 12;
        const payment = monthlyRate === 0
            ? amount / durationMonths
            : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -durationMonths));
        const roundedPayment = this.roundCurrency(payment);
        let balance = amount;
        const schedule = [];
        let totalInterest = 0;
        for (let index = 1; index <= durationMonths; index += 1) {
            const interestPortion = this.roundCurrency(balance * monthlyRate);
            const principalPortion = this.roundCurrency(roundedPayment - interestPortion);
            balance = this.roundCurrency(balance - principalPortion);
            totalInterest += interestPortion;
            schedule.push({
                installment: index,
                amount: roundedPayment,
                interestPortion,
                principalPortion,
                remainingBalance: Math.max(balance, 0),
                dueDate: this.addMonthsToNow(index),
            });
        }
        const totalCost = this.roundCurrency(amount + totalInterest);
        return {
            amount,
            durationMonths,
            interestRate,
            monthlyPayment: roundedPayment,
            totalInterest: this.roundCurrency(totalInterest),
            totalCost,
            schedule,
        };
    }
    async ensureUserEligible(userId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('users')
            .select('id, kyc_status, role')
            .eq('id', userId)
            .maybeSingle();
        if (error) {
            this.logSupabaseError('ensureUserEligible.selectUser', error, { userId });
            throw new common_1.BadRequestException(`Unable to verify user: ${error.message}`);
        }
        if (!data) {
            throw new common_1.NotFoundException('User not found');
        }
        if (data.kyc_status !== 'APPROVED') {
            throw new common_1.BadRequestException('KYC verification must be approved before requesting a loan');
        }
        return data;
    }
    sanitizeDocuments(documents) {
        return documents.map((doc) => ({
            filename: doc.filename,
            mimeType: doc.mimeType,
            size: doc.size,
            base64: doc.base64?.substring(0, 1_000_000),
            url: doc.url ?? null,
        }));
    }
    async getLoanOrThrow(loanId) {
        const { data, error } = await this.supabase
            .getAdminClient()
            .from('loans')
            .select('*')
            .eq('id', loanId)
            .maybeSingle();
        if (error) {
            this.logSupabaseError('getLoanOrThrow.select', error, { loanId });
            throw new common_1.BadRequestException(`Unable to load loan: ${error.message}`);
        }
        if (!data) {
            throw new common_1.NotFoundException('Loan not found');
        }
        return data;
    }
    async calculateRiskScore(userId, amount, durationMonths, monthlyIncome) {
        const monthlyRepayment = amount / durationMonths;
        const debtToIncomeRatio = monthlyRepayment / monthlyIncome;
        const { data: pastLoans, error: pastLoansError } = await this.supabase
            .getAdminClient()
            .from('loans')
            .select('status, outstanding_balance')
            .eq('user_id', userId)
            .neq('status', loan_constants_1.LOAN_STATUSES.PENDING_REVIEW);
        if (pastLoansError) {
            this.logSupabaseError('calculateRiskScore.fetchLoans', pastLoansError, { userId });
            throw new common_1.BadRequestException(`Unable to compute risk profile: ${pastLoansError.message}`);
        }
        const penaltyForLateLoans = (pastLoans ?? []).filter((loan) => loan.status === loan_constants_1.LOAN_STATUSES.LATE_PAYMENT).length * 7;
        const penaltyForUnpaidLoans = (pastLoans ?? []).filter((loan) => loan.status !== loan_constants_1.LOAN_STATUSES.PAID && loan.outstanding_balance && loan.outstanding_balance > 0).length * 10;
        const incomeScore = Math.max(0, 40 - debtToIncomeRatio * 80);
        const historyScore = Math.max(0, 40 - penaltyForLateLoans - penaltyForUnpaidLoans);
        const diversificationScore = Math.min(20, (durationMonths / 24) * 20);
        return Math.round(Math.max(10, Math.min(95, incomeScore + historyScore + diversificationScore)));
    }
    determineInterestRate(riskScore, durationMonths) {
        const riskSpread = (100 - riskScore) / 100;
        const durationSpread = durationMonths / 480;
        const rate = loan_constants_1.DEFAULT_INTEREST_RATE + riskSpread * 0.05 + durationSpread * 0.05;
        return this.normalizeInterestRate(rate);
    }
    normalizeInterestRate(value) {
        return Math.max(loan_constants_1.MIN_INTEREST_RATE, Math.min(loan_constants_1.MAX_INTEREST_RATE, Number(value.toFixed(4))));
    }
    async resolveDefaultAccount(userId) {
        const accounts = await this.accountsService.findByUserId(userId);
        const activeAccount = accounts.find((account) => account.status === 'ACTIVE') ?? accounts[0];
        if (!activeAccount) {
            throw new common_1.BadRequestException('No account found for disbursement');
        }
        return activeAccount.id;
    }
    async disburseLoan(userId, accountId, amount) {
        const account = await this.accountsService.findById(accountId);
        if (account.user_id !== userId) {
            throw new common_1.BadRequestException('Cannot disburse loan to an account belonging to a different user');
        }
        const newBalance = this.roundCurrency(Number(account.balance ?? 0) + amount);
        const { error } = await this.supabase
            .getAdminClient()
            .from('accounts')
            .update({ balance: newBalance })
            .eq('id', accountId);
        if (error) {
            this.logSupabaseError('disburseLoan.updateAccount', error, { accountId, userId });
            throw new common_1.BadRequestException(`Unable to disburse loan: ${error.message}`);
        }
    }
    computeNextDueDate(loan, paidAtIso) {
        if (!loan.amortization_schedule?.length) {
            return this.addMonthsToDate(paidAtIso, 1);
        }
        const now = new Date(paidAtIso).getTime();
        const nextInstallment = loan.amortization_schedule.find((item) => new Date(item.dueDate).getTime() > now);
        return nextInstallment?.dueDate ?? null;
    }
    deriveStatusFromDueDate(nextDueDate, remainingBalance) {
        if (!nextDueDate) {
            return remainingBalance <= 1 ? loan_constants_1.LOAN_STATUSES.PAID : loan_constants_1.LOAN_STATUSES.IN_PROGRESS;
        }
        const due = new Date(nextDueDate).getTime();
        return Date.now() > due && remainingBalance > 1 ? loan_constants_1.LOAN_STATUSES.LATE_PAYMENT : loan_constants_1.LOAN_STATUSES.IN_PROGRESS;
    }
    addMonthsToNow(months) {
        const now = new Date();
        now.setMonth(now.getMonth() + months);
        return now.toISOString();
    }
    addMonthsToDate(isoDate, months) {
        const date = new Date(isoDate);
        date.setMonth(date.getMonth() + months);
        return date.toISOString();
    }
    roundCurrency(value) {
        return Number(value.toFixed(2));
    }
    logSupabaseError(operation, error, metadata = {}) {
        const contextPayload = {
            operation,
            code: error.code,
            details: error.details,
            hint: error.hint,
            ...metadata,
        };
        this.logger.error(`Supabase error during ${operation}: ${error.message}`, JSON.stringify(contextPayload), LoansService_1.name);
    }
};
exports.LoansService = LoansService;
exports.LoansService = LoansService = LoansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService,
        audit_logs_service_1.AuditLogsService,
        notifications_service_1.NotificationsService,
        accounts_service_1.AccountsService])
], LoansService);
//# sourceMappingURL=loans.service.js.map