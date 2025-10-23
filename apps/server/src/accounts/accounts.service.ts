import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class AccountsService {
  constructor(private supabase: SupabaseService) {}

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

  async getBalance(accountId: string): Promise<number> {
    const account = await this.findById(accountId);
    return parseFloat(account.balance);
  }

  async update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<any> {
    const account = await this.findById(accountId);

    const updateData: any = {};
    if (updateDto.accountNumber) {
      updateData.account_number = updateDto.accountNumber;
    }

    const { data, error } = await this.supabase.getAdminClient()
      .from('accounts')
      .update(updateData)
      .eq('id', accountId)
      .select()
      .single();

    if (error) throw new BadRequestException(`Failed to update account: ${error.message}`);

    await this.supabase.getAdminClient().from('audit_logs').insert({
      user_id: account.user_id,
      action: 'ACCOUNT_UPDATED',
      entity_type: 'account',
      entity_id: accountId,
      performed_by: adminId,
      changes: updateData,
    });

    return data;
  }
}
