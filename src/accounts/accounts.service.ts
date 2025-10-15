import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

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
}
