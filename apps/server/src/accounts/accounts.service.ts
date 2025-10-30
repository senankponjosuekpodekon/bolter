import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateAccountDto, AccountType } from './dto/create-account.dto';
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
  ) { }

  async findByUserId(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('user_id', userId);
    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`);
    return data;
  }

  async findById(id: string): Promise<any> {
    const { data, error } = await this.supabase.getAdminClient().from('accounts').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(`Failed to fetch account: ${error.message}`);
    if (!data) throw new NotFoundException(`Account with ID ${id} not found`);
    return data;
  }

  async findAll(query: QueryAccountsDto): Promise<{ data: any[]; total: number }> {
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

    const items = data ?? [];

    return {
      data: items,
      total: typeof count === 'number' ? count : items.length,
    };
  }

  async findByIds(ids: string[]): Promise<any[]> {
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

    return data ?? [];
  }

  async create(userId: string, dto: CreateAccountDto): Promise<any> {
    const accountType: AccountType = dto.accountType || 'SAVINGS';
    const accountNumber = generateFrenchIban();

    const { data, error } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .insert({
        user_id: userId,
        account_number: accountNumber,
        account_type: accountType,
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
          accountNumber,
        },
      },
    });

    if (!success) {
      this.logger.warn(`Failed to persist audit log for account creation (${data.id})`);
    }

    await this.notificationsService.notifyAccountCreated(userId, accountNumber);

    return data;
  }

  async getBalance(accountId: string): Promise<number> {
    const account = await this.findById(accountId);
    return parseFloat(account.balance);
  }

  async update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<any> {
    const account = await this.findById(accountId);

    const updateData: Record<string, any> = {};

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

    if (!Object.keys(updateData).length) {
      return account;
    }

    const { data, error } = await this.supabase
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

    return data;
  }
}
