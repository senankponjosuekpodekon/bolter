import { Injectable, BadRequestException, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto, PaymentMethod } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

type RawTransactionRow = {
  id: string;
  from_account_id?: string | null;
  to_account_id?: string | null;
  amount?: string | number | null;
  validated_by?: string | null;
  type?: string;
  status?: string;
  currency?: string | null;
  description?: string | null;
  created_at?: string | null;
};

type RawAccountRow = {
  id: string;
  user_id?: string | null;
  account_number?: string;
  balance?: string | number;
};

type RawUserRow = {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
};

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly accountsService: AccountsService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const fromAccount = await this.accountsService.findById(dto.fromAccountId.toString());
    if (fromAccount.user_id !== userId) {
      this.logger.warn(`User ${userId} attempted transfer from account ${dto.fromAccountId} owned by ${fromAccount.user_id}`);
      throw new ForbiddenException('You can only transfer from your own accounts');
    }

    if (dto.toAccountId) {
      const toAccount = await this.accountsService.findById(dto.toAccountId.toString());
      if (toAccount.user_id !== userId) {
        this.logger.warn(`User ${userId} attempted transfer to internal account ${dto.toAccountId} owned by ${toAccount.user_id}`);
        throw new ForbiddenException('You can only transfer to your own internal accounts');
      }
    }

    if (Number(fromAccount.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .insert({
        from_account_id: dto.fromAccountId,
        to_account_id: dto.toAccountId || null,
        amount: dto.amount,
        currency: 'EUR',
        type: 'TRANSFER',
        status: 'PENDING',
        description: dto.description,
        iban_external: dto.ibanExternal || null,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create transfer: ${error.message}`);
    }

    await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
      type: 'TRANSFER',
      amount: dto.amount,
      toAccountId: dto.toAccountId ?? null,
      ibanExternal: dto.ibanExternal ?? null,
    });

    await this.notificationsService.notifyTransactionCreated({
      transactionId: data.id,
      userId,
      amount: Number(data.amount ?? dto.amount),
      type: 'TRANSFER',
      currency: data.currency,
      description: dto.description ?? undefined,
    });

    return data;
  }

  async createDeposit(userId: string, dto: CreateDepositDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const account = await this.accountsService.findById(dto.accountId.toString());
    if (account.user_id !== userId) {
      this.logger.warn(`User ${userId} attempted deposit to account ${dto.accountId} owned by ${account.user_id}`);
      throw new ForbiddenException('You can only deposit to your own accounts');
    }

    const description = this.buildDepositDescription(dto.paymentMethod, dto.reference, dto.description);

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .insert({
        from_account_id: null,
        to_account_id: dto.accountId,
        amount: dto.amount,
        currency: 'EUR',
        type: 'DEPOSIT',
        status: 'PENDING',
        description,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create deposit: ${error.message}`);
    }

    await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
      type: 'DEPOSIT',
      amount: dto.amount,
      paymentMethod: dto.paymentMethod,
    });

    await this.notificationsService.notifyTransactionCreated({
      transactionId: data.id,
      userId,
      amount: Number(data.amount ?? dto.amount),
      type: 'DEPOSIT',
      currency: data.currency,
      description,
    });

    return data;
  }

  async createWithdraw(userId: string, dto: CreateWithdrawDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const account = await this.accountsService.findById(dto.accountId.toString());
    if (account.user_id !== userId) {
      this.logger.warn(`User ${userId} attempted withdraw from account ${dto.accountId} owned by ${account.user_id}`);
      throw new ForbiddenException('You can only withdraw from your own accounts');
    }

    if (Number(account.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const description = dto.description || `Withdrawal to ${dto.bankDetails.iban}`;

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .insert({
        from_account_id: dto.accountId,
        to_account_id: null,
        amount: dto.amount,
        currency: 'EUR',
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description,
        iban_external: dto.bankDetails.iban,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create withdrawal: ${error.message}`);
    }

    await this.logTransactionAction(userId, userId, 'TRANSACTION_INITIATED', data.id, {
      type: 'WITHDRAWAL',
      amount: dto.amount,
      ibanExternal: dto.bankDetails.iban,
    });

    await this.notificationsService.notifyTransactionCreated({
      transactionId: data.id,
      userId,
      amount: Number(data.amount ?? dto.amount),
      type: 'WITHDRAWAL',
      currency: data.currency,
      description,
    });

    return data;
  }

  async findByUserId(userId: string) {
    const accounts = await this.accountsService.findByUserId(userId);
    const accountIds = accounts.map((account) => account.id);
    if (accountIds.length === 0) {
      this.logger.debug(`User ${userId} has no accounts; returning empty transaction list`);
      return [];
    }

    const formattedIds = accountIds.map((id) => `"${id}"`).join(',');
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .select('*')
      .or(`from_account_id.in.(${formattedIds}),to_account_id.in.(${formattedIds})`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    }

    return data;
  }

  async findPending() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true });

    if (error) {
      throw new BadRequestException(`Failed to fetch pending transactions: ${error.message}`);
    }

    return data;
  }

  async findPendingById(id: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('status', 'PENDING')
      .maybeSingle();

    if (error) {
      throw new BadRequestException(`Failed to fetch transaction: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Pending transaction not found');
    }

    return data;
  }

  async findAllForAdmin(query: QueryTransactionsDto) {
    const { skip = 0, take = 25, status, type, accountId, userId, search, autoApproved } = query;

    const client = this.supabase.getAdminClient();
    let request = client
      .from('transactions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status) {
      request = request.eq('status', status);
    }
    if (type) {
      request = request.eq('type', type);
    }
    if (autoApproved === 'true') {
      request = request.not('validated_by', 'is', null);
    } else if (autoApproved === 'false') {
      request = request.is('validated_by', null);
    }

    const orFilters: string[] = [];

    if (accountId) {
      orFilters.push(`from_account_id.eq.${accountId}`);
      orFilters.push(`to_account_id.eq.${accountId}`);
    }

    if (userId) {
      const userAccounts = await this.accountsService.findByUserId(userId);
      const ids = userAccounts.map((account) => account.id);
      if (ids.length === 0) {
        return { data: [], total: 0 };
      }
      const formatted = ids.map((id) => `"${id}"`).join(',');
      orFilters.push(`from_account_id.in.(${formatted})`);
      orFilters.push(`to_account_id.in.(${formatted})`);
    }

    if (search) {
      const pattern = `%${search}%`;
      orFilters.push(`description.ilike.${pattern}`);
      orFilters.push(`iban_external.ilike.${pattern}`);
    }

    if (orFilters.length) {
      request = request.or(orFilters.join(','));
    }

    const to = take ? skip + take - 1 : skip + 24;
    const { data, error, count } = await request.range(skip, to);
    if (error) {
      throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    }

    const items = data ?? [];
    const accountIds = Array.from(
      new Set(
        items
          .flatMap((tx: RawTransactionRow) => [tx.from_account_id, tx.to_account_id])
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const accountsMap = new Map<string, RawAccountRow | null>();
    if (accountIds.length) {
      const { data: accounts, error: accountsError } = await client
        .from('accounts')
        .select('*, user:users(id, email, first_name, last_name, phone)')
        .in('id', accountIds);

      if (accountsError) {
        throw new BadRequestException(`Failed to load transaction accounts: ${accountsError.message}`);
      }

      accounts?.forEach((account: RawAccountRow) => {
        accountsMap.set(account.id, account);
      });
    }

    const validatorIds = Array.from(
      new Set(items.map((tx: RawTransactionRow) => tx.validated_by).filter((value): value is string => Boolean(value))),
    );

    const validatorsMap = new Map<string, RawUserRow | null>();
    if (validatorIds.length) {
      const { data: validators, error: validatorsError } = await client
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', validatorIds);

      if (validatorsError) {
        throw new BadRequestException(`Failed to load validator profiles: ${validatorsError.message}`);
      }

      validators?.forEach((user: RawUserRow) => {
        validatorsMap.set(user.id, user);
      });
    }

    const enriched = items.map((transaction: RawTransactionRow) => ({
      ...transaction,
      fromAccount: transaction.from_account_id ? accountsMap.get(transaction.from_account_id) ?? null : null,
      toAccount: transaction.to_account_id ? accountsMap.get(transaction.to_account_id) ?? null : null,
      validator: transaction.validated_by ? validatorsMap.get(transaction.validated_by) ?? null : null,
    }));

    return {
      data: enriched,
      total: typeof count === 'number' ? count : enriched.length,
    };
  }

  async createAdminTransaction(adminId: string, dto: AdminCreateTransactionDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const currency = dto.currency ?? 'EUR';
    const autoApprove = dto.autoApprove ?? true;

    switch (dto.type) {
      case 'TRANSFER':
        return this.createAdminTransfer(adminId, dto, currency, autoApprove);
      case 'DEPOSIT':
        return this.createAdminDeposit(adminId, dto, currency, autoApprove);
      case 'WITHDRAWAL':
        return this.createAdminWithdrawal(adminId, dto, currency, autoApprove);
      default:
        throw new BadRequestException(`Unsupported transaction type: ${dto.type}`);
    }
  }

  async validateTransaction(adminId: string, transactionId: string, dto: ValidateTransactionDto) {
    const client = this.supabase.getAdminClient();
    const { data: transaction, error: fetchError } = await client
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (fetchError || !transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'PENDING') {
      throw new BadRequestException('Transaction has already been processed');
    }

    const amount = Number(transaction.amount);
    const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
    let fromAccount: RawAccountRow | null = null;
    let toAccount: RawAccountRow | null = null;

    if (dto.approved) {
      if ((transaction.type === 'TRANSFER' || transaction.type === 'WITHDRAWAL') && transaction.from_account_id) {
        fromAccount = await this.accountsService.findById(transaction.from_account_id.toString());
        const currentBalance = Number(fromAccount.balance);
        if (currentBalance < amount) {
          throw new BadRequestException('Insufficient balance');
        }
        await this.updateAccountBalance(transaction.from_account_id, currentBalance - amount);
      }

      if ((transaction.type === 'TRANSFER' || transaction.type === 'DEPOSIT') && transaction.to_account_id) {
        toAccount = await this.accountsService.findById(transaction.to_account_id.toString());
        const currentBalance = Number(toAccount.balance);
        await this.updateAccountBalance(transaction.to_account_id, currentBalance + amount);
      }
    }

    if (!dto.approved) {
      if (!fromAccount && transaction.from_account_id) {
        fromAccount = await this.accountsService.findById(transaction.from_account_id.toString());
      }
      if (!toAccount && transaction.to_account_id) {
        toAccount = await this.accountsService.findById(transaction.to_account_id.toString());
      }
    }

    const { data, error } = await client
      .from('transactions')
      .update({
        status: newStatus,
        validated_by: adminId,
        validated_at: new Date().toISOString(),
        rejection_reason: dto.rejectionReason || null,
      })
      .eq('id', transactionId)
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to validate transaction: ${error.message}`);
    }

    const targetUserId = transaction.from_account_id
      ? fromAccount?.user_id ?? null
      : toAccount?.user_id ?? null;

    await this.logTransactionAction(targetUserId, adminId, dto.approved ? 'TRANSACTION_APPROVED' : 'TRANSACTION_REJECTED', transactionId, {
      type: transaction.type,
      amount: transaction.amount,
      rejectionReason: dto.rejectionReason ?? null,
    });

    if (targetUserId) {
      await this.notificationsService.notifyTransactionUpdated({
        transactionId,
        userId: targetUserId,
        status: dto.approved ? 'APPROVED' : 'REJECTED',
        amount: Number(transaction.amount ?? data.amount),
        type: transaction.type,
        currency: transaction.currency ?? data?.currency ?? 'EUR',
        rejectionReason: dto.rejectionReason ?? undefined,
      });
    }

    return data;
  }

  private buildDepositDescription(paymentMethod: PaymentMethod, reference?: string, description?: string) {
    if (description) {
      return description;
    }
    return `Deposit via ${paymentMethod}${reference ? ` - Ref: ${reference}` : ''}`;
  }

  private async createAdminTransfer(adminId: string, dto: AdminCreateTransactionDto, currency: string, autoApprove: boolean) {
    if (!dto.fromAccountId) {
      throw new BadRequestException('fromAccountId is required for transfers');
    }
    if (!dto.toAccountId && !dto.ibanExternal) {
      throw new BadRequestException('Provide either toAccountId or ibanExternal for transfers');
    }
    if (dto.toAccountId && dto.toAccountId === dto.fromAccountId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    const client = this.supabase.getAdminClient();
    const fromAccount = await this.accountsService.findById(dto.fromAccountId.toString());
    const toAccount = dto.toAccountId ? await this.accountsService.findById(dto.toAccountId.toString()) : null;

    if (autoApprove && Number(fromAccount.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const status = autoApprove ? 'APPROVED' : 'PENDING';
    const description = dto.description || (dto.toAccountId ? `Admin transfer to account ${dto.toAccountId}` : `Admin transfer to ${dto.ibanExternal}`);

    const { data, error } = await client
      .from('transactions')
      .insert({
        from_account_id: dto.fromAccountId,
        to_account_id: dto.toAccountId ?? null,
        amount: dto.amount,
        currency,
        type: 'TRANSFER',
        status,
        description,
        iban_external: dto.ibanExternal ?? null,
        validated_by: autoApprove ? adminId : null,
        validated_at: autoApprove ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create transfer: ${error.message}`);
    }

    if (autoApprove) {
      const fromBalance = Number(fromAccount.balance) - dto.amount;
      await this.updateAccountBalance(fromAccount.id, fromBalance);

      if (toAccount) {
        const toBalance = Number(toAccount.balance) + dto.amount;
        await this.updateAccountBalance(toAccount.id, toBalance);
      }
    }

    await this.logTransactionAction(fromAccount.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
      type: 'TRANSFER',
      status,
      amount: data.amount,
      autoApprove,
      toAccountId: dto.toAccountId ?? null,
      ibanExternal: dto.ibanExternal ?? null,
    });

    if (autoApprove) {
      await this.logTransactionAction(fromAccount.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
        type: 'TRANSFER',
        amount: data.amount,
      });
    }

    const amountValue = Number(data.amount ?? dto.amount);

    if (!autoApprove) {
      await this.notificationsService.notifyTransactionCreated({
        transactionId: data.id,
        userId: fromAccount.user_id,
        amount: amountValue,
        type: 'TRANSFER',
        currency: data.currency,
        description,
      });

      if (toAccount && toAccount.user_id && toAccount.user_id !== fromAccount.user_id) {
        await this.notificationsService.notifyTransactionCreated({
          transactionId: data.id,
          userId: toAccount.user_id,
          amount: amountValue,
          type: 'TRANSFER',
          currency: data.currency,
          description,
        });
      }
    } else {
      await this.notificationsService.notifyTransactionUpdated({
        transactionId: data.id,
        userId: fromAccount.user_id,
        status: 'APPROVED',
        amount: amountValue,
        type: 'TRANSFER',
        currency,
      });

      if (toAccount && toAccount.user_id && toAccount.user_id !== fromAccount.user_id) {
        await this.notificationsService.notifyTransactionUpdated({
          transactionId: data.id,
          userId: toAccount.user_id,
          status: 'APPROVED',
          amount: amountValue,
          type: 'TRANSFER',
          currency,
        });
      }
    }

    return data;
  }

  private async createAdminDeposit(adminId: string, dto: AdminCreateTransactionDto, currency: string, autoApprove: boolean) {
    if (!dto.toAccountId) {
      throw new BadRequestException('toAccountId is required for deposits');
    }
    if (!dto.paymentMethod) {
      throw new BadRequestException('paymentMethod is required for deposits');
    }

    const client = this.supabase.getAdminClient();
    const account = await this.accountsService.findById(dto.toAccountId.toString());

    const status = autoApprove ? 'APPROVED' : 'PENDING';
    const description = this.buildDepositDescription(dto.paymentMethod, dto.reference, dto.description);

    const { data, error } = await client
      .from('transactions')
      .insert({
        from_account_id: null,
        to_account_id: dto.toAccountId,
        amount: dto.amount,
        currency,
        type: 'DEPOSIT',
        status,
        description,
        validated_by: autoApprove ? adminId : null,
        validated_at: autoApprove ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create deposit: ${error.message}`);
    }

    if (autoApprove) {
      const newBalance = Number(account.balance) + dto.amount;
      await this.updateAccountBalance(account.id, newBalance);
    }

    await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
      type: 'DEPOSIT',
      status,
      amount: data.amount,
      autoApprove,
      paymentMethod: dto.paymentMethod,
    });

    if (autoApprove) {
      await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
        type: 'DEPOSIT',
        amount: data.amount,
      });
    }

    const amountValue = Number(data.amount ?? dto.amount);

    if (!autoApprove) {
      await this.notificationsService.notifyTransactionCreated({
        transactionId: data.id,
        userId: account.user_id,
        amount: amountValue,
        type: 'DEPOSIT',
        currency: data.currency,
        description,
      });
    } else {
      await this.notificationsService.notifyTransactionUpdated({
        transactionId: data.id,
        userId: account.user_id,
        status: 'APPROVED',
        amount: amountValue,
        type: 'DEPOSIT',
        currency,
      });
    }

    return data;
  }

  private async createAdminWithdrawal(adminId: string, dto: AdminCreateTransactionDto, currency: string, autoApprove: boolean) {
    if (!dto.fromAccountId) {
      throw new BadRequestException('fromAccountId is required for withdrawals');
    }
    if (!dto.bankDetails) {
      throw new BadRequestException('bankDetails are required for withdrawals');
    }

    const client = this.supabase.getAdminClient();
    const account = await this.accountsService.findById(dto.fromAccountId.toString());

    if (autoApprove && Number(account.balance) < dto.amount) {
      throw new BadRequestException('Insufficient balance');
    }

    const status = autoApprove ? 'APPROVED' : 'PENDING';
    const description = dto.description || `Withdrawal to ${dto.bankDetails.iban}`;

    const { data, error } = await client
      .from('transactions')
      .insert({
        from_account_id: dto.fromAccountId,
        to_account_id: null,
        amount: dto.amount,
        currency,
        type: 'WITHDRAWAL',
        status,
        description,
        iban_external: dto.bankDetails.iban,
        validated_by: autoApprove ? adminId : null,
        validated_at: autoApprove ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (error) {
      throw new BadRequestException(`Failed to create withdrawal: ${error.message}`);
    }

    if (autoApprove) {
      const newBalance = Number(account.balance) - dto.amount;
      if (newBalance < 0) {
        throw new BadRequestException('Insufficient balance');
      }
      await this.updateAccountBalance(account.id, newBalance);
    }

    await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_CREATED', data.id, {
      type: 'WITHDRAWAL',
      status,
      amount: data.amount,
      autoApprove,
      ibanExternal: dto.bankDetails.iban,
    });

    if (autoApprove) {
      await this.logTransactionAction(account.user_id, adminId, 'TRANSACTION_APPROVED', data.id, {
        type: 'WITHDRAWAL',
        amount: data.amount,
      });
    }

    const amountValue = Number(data.amount ?? dto.amount);

    if (!autoApprove) {
      await this.notificationsService.notifyTransactionCreated({
        transactionId: data.id,
        userId: account.user_id,
        amount: amountValue,
        type: 'WITHDRAWAL',
        currency: data.currency,
        description,
      });
    } else {
      await this.notificationsService.notifyTransactionUpdated({
        transactionId: data.id,
        userId: account.user_id,
        status: 'APPROVED',
        amount: amountValue,
        type: 'WITHDRAWAL',
        currency,
      });
    }

    return data;
  }

  private async updateAccountBalance(accountId: string, newBalance: number) {
    const rounded = Number(newBalance.toFixed(2));
    const { error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .update({ balance: rounded })
      .eq('id', accountId);

    if (error) {
      throw new BadRequestException(`Failed to update account balance: ${error.message}`);
    }
  }

  private async logTransactionAction(
    userId: string | null,
    performedBy: string,
    action: string,
    transactionId: string,
    changes: Record<string, unknown>,
  ) {
    const metadata = changes && Object.keys(changes).length ? { changes } : undefined;
    const success = await this.auditLogsService.log({
      userId,
      performedBy,
      action,
      resourceType: 'transaction',
      resourceId: transactionId,
      metadata,
    });

    if (!success) {
      this.logger.error(`Failed to write audit log for transaction ${transactionId}`);
    }
  }
}
