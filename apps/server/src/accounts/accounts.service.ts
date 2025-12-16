import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { DataCleanupService } from '../common/services/data-cleanup.service';

export interface Account {
  id: string;
  user_id: string;
  account_number: string;
  account_type: AccountType;
  balance: number;
  currency?: string;
  limit?: number;
  status: string;
  created_at?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountType } from './dto/create-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { generateFrenchIban } from '../common/utils/account-number.util';
import { QueryAccountsDto } from './dto/query-accounts.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);

  constructor(
    private supabase: SupabaseService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
    private readonly dataCleanupService: DataCleanupService,
  ) { }

  async findByUserId(userId: string): Promise<Account[]> {
    const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
    return (data ?? []) as Account[];
  }

  async findById(id: string): Promise<Account> {
    const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to fetch account: ${error.message}`);
    if (!data) throw new NotFoundException(`Account with ID ${id} not found`);
    return data as Account;
  }

  async findAll(query: QueryAccountsDto): Promise<{ data: Account[]; total: number }> {
    const { skip = 0, take = 25, status, userId, search } = query;
    const client = this.supabase.getAdminClient();
    let request = client
      .from('accounts')
      .select('*, user:users(id, email, first_name, last_name, phone)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (userId) {
      request = request.eq('user_id', userId);
    }
    if (status) {
      request = request.eq('status', status);
    }
    if (search) {
      const pattern = `%${search}%`;
      request = request.ilike('account_number', pattern);
    }

    const to = take ? skip + take - 1 : skip + 24;
    const { data, error, count } = await request.range(skip, to);
    if (error) {
      throw new BadRequestException(`Failed to fetch accounts: ${error.message}`);
    }

    const items = (data ?? []) as Account[];

    return {
      data: items,
      total: typeof count === 'number' ? count : items.length,
    };
  }

  async findByIds(ids: string[]): Promise<Account[]> {
    if (!ids.length) {
      return [];
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .select('*, user:users(id, email, first_name, last_name, phone)')
      .in('id', ids);

    if (error) {
      throw new BadRequestException(`Failed to fetch accounts: ${error.message}`);
    }

    return (data ?? []) as Account[];
  }

  async create(userId: string, dto: CreateAccountDto, bypassLimits: boolean = false): Promise<Account> {
    const accountType: AccountType = dto.accountType || 'SAVINGS';
    const currency = dto.currency || 'EUR';
    const limit = dto.limit || 1000;
    const accountNumber = generateFrenchIban();

    // Check account type limits: max 2 CHECKING and 2 SAVINGS per user (unless bypassed by admin)
    if (!bypassLimits) {
      const { data: existingAccounts, error: fetchError } = await this.supabase
        .getAdminClient()
        .from('accounts')
        .select('account_type')
        .eq('user_id', userId);

      if (fetchError) {
        throw new BadRequestException(`Failed to verify account limits: ${fetchError.message}`);
      }

      const accountTypeCounts = existingAccounts?.reduce(
        (acc, acc_item) => {
          acc[acc_item.account_type as AccountType] = (acc[acc_item.account_type as AccountType] || 0) + 1;
          return acc;
        },
        {} as Record<AccountType, number>
      ) ?? {};

      if ((accountTypeCounts[accountType] ?? 0) >= 2) {
        throw new BadRequestException(
          `You already have ${accountTypeCounts[accountType]} ${accountType} account(s). Maximum 2 ${accountType} accounts allowed per user.`
        );
      }
    }

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: accountNumber,
        account_type: accountType,
        currency: currency,
        limit: limit,
        balance: 0,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to create account: ${error.message}`);

    const success = await this.auditLogsService.log({
      userId,
      performedBy: userId,
      action: 'ACCOUNT_CREATED',
      resourceType: 'account',
      resourceId: data.id,
      metadata: {
        changes: {
          accountType,
          currency,
          limit,
          accountNumber,
        },
      },
    });

    if (!success) {
      this.logger.warn(`Failed to persist audit log for account creation (${data.id})`);
    }

    await this.notificationsService.notifyAccountCreated(userId, accountNumber);

    return data as Account;
  }

  async getBalance(accountId: string): Promise<number> {
    const account = await this.findById(accountId);
    return account.balance;
  }

  async update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<Account> {
    const account = await this.findById(accountId);

    const updateData: Partial<Account> = {};

    if (updateDto.accountNumber !== undefined) {
      updateData.account_number = updateDto.accountNumber;
    }
    if (updateDto.accountType !== undefined) {
      updateData.account_type = updateDto.accountType;
    }
    if (updateDto.status !== undefined) {
      updateData.status = updateDto.status;
    }
    if (updateDto.balance !== undefined) {
      const roundedBalance = Math.round(updateDto.balance * 100) / 100;
      updateData.balance = roundedBalance;
    }
    if (updateDto.currency !== undefined) {
      updateData.currency = updateDto.currency;
    }
    if (updateDto.limit !== undefined) {
      updateData.limit = updateDto.limit;
    }

    if (!Object.keys(updateData).length) {
      return account;
    }

    const { data: updatedAccount, error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update account: ${error.message}`);

    const success = await this.auditLogsService.log({
      userId: account.user_id,
      performedBy: adminId,
      action: 'ACCOUNT_UPDATED',
      resourceType: 'account',
      resourceId: accountId,
      metadata: { changes: updateData },
    });

    if (!success) {
      this.logger.warn(`Failed to persist audit log for account update (${accountId})`);
    }

    return updatedAccount as Account;
  }

  async delete(userId: string, accountId: string, deleteDto: DeleteAccountDto): Promise<{ message: string; deletedAt: string }> {
    const account = await this.findById(accountId);

    // Verify user owns this account or is admin (admin check would be in controller via guard)
    if (account.user_id !== userId) {
      throw new BadRequestException('You can only delete your own accounts');
    }

    const deletedAt = new Date().toISOString();
    const updateData = {
      deleted_at: deletedAt,
      deletion_reason: deleteDto.reason || 'User-initiated account deletion',
      status: 'DELETED',
    };

    const { error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to delete account: ${error.message}`);

    // If permanent deletion requested, delete files immediately
    if (deleteDto.permanent) {
      try {
        await this.dataCleanupService.deleteUserFiles(userId);
        this.logger.log(`Permanently deleted all files for user ${userId}`);
      } catch (cleanupError) {
        this.logger.error(`Failed to permanently delete user files: ${cleanupError}`, cleanupError);
        // Don't throw - account deletion succeeded, file cleanup failed but can be retried
      }
    }

    // Log the account deletion
    const success = await this.auditLogsService.log({
      userId,
      performedBy: userId,
      action: 'ACCOUNT_DELETED',
      resourceType: 'account',
      resourceId: accountId,
      metadata: {
        reason: deleteDto.reason,
        permanent: deleteDto.permanent || false,
        retentionDays: deleteDto.permanent ? 0 : 90,
      },
    });

    if (!success) {
      this.logger.warn(`Failed to persist audit log for account deletion (${accountId})`);
    }

    await this.notificationsService.notifyAccountDeleted(userId, account.account_number);

    return {
      message: `Account marked for deletion. Data will be retained for 90 days before permanent removal (RGPD compliance).`,
      deletedAt,
    };
  }
}
