import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service';
import { AccountsService } from '../../apps/server/src/accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class TransactionsService {
  constructor(
    private supabase: SupabaseService,
    private accountsService: AccountsService,
    private alertsService: AlertsService,
  ) { }

  async createTransfer(userId: string, dto: CreateTransferDto) {
    const fromAccount = await this.accountsService.findById(dto.fromAccountId.toString());
    if (fromAccount.user_id !== userId) throw new BadRequestException('You can only transfer from your own accounts');
    if (Number(fromAccount.balance) < dto.amount) throw new BadRequestException('Insufficient balance');

    const { data, error } = await this.supabase.getAdminClient().from('transactions').insert({
      from_account_id: dto.fromAccountId, to_account_id: dto.toAccountId || null, amount: dto.amount,
      currency: 'EUR', type: 'TRANSFER', status: 'PENDING', description: dto.description, iban_external: dto.ibanExternal || null,
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create transfer: ${error.message}`);
    // Déclenche l’alerte si besoin
    await this.alertsService.checkAndNotify(userId, dto.amount, 'TRANSFER');
    return data;
  }

  async findByUserId(userId: string) {
    const accounts = await this.accountsService.findByUserId(userId);
    const accountIds = accounts.map(a => a.id);
    const { data, error } = await this.supabase.getAdminClient().from('transactions').select('*')
      .or(`from_account_id.in.(${accountIds.join(',')}),to_account_id.in.(${accountIds.join(',')})`).order('created_at', { ascending: false });
    if (error) throw new BadRequestException(`Failed to fetch transactions: ${error.message}`);
    return data;
  }

  async findPending() {
    const { data, error } = await this.supabase.getAdminClient().from('transactions').select('*').eq('status', 'PENDING').order('created_at', { ascending: true });
    if (error) throw new BadRequestException(`Failed to fetch pending transactions: ${error.message}`);
    return data;
  }

  async validateTransaction(adminId: string, transactionId: string, dto: ValidateTransactionDto) {
    const { data: transaction, error: fetchError } = await this.supabase.getAdminClient().from('transactions').select('*').eq('id', transactionId).maybeSingle();
    if (fetchError || !transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== 'PENDING') throw new BadRequestException('Transaction has already been processed');

    const newStatus = dto.approved ? 'APPROVED' : 'REJECTED';
    if (dto.approved) {
      const fromAccount = await this.accountsService.findById(transaction.from_account_id.toString());
      const currentBalance = Number(fromAccount.balance);
      if (currentBalance < Number(transaction.amount)) throw new BadRequestException('Insufficient balance');

      await this.supabase.getAdminClient().from('accounts').update({ balance: currentBalance - Number(transaction.amount) }).eq('id', transaction.from_account_id);
      if (transaction.to_account_id) {
        const toAccount = await this.accountsService.findById(transaction.to_account_id.toString());
        const toBalance = toAccount.balance;
        await this.supabase.getAdminClient().from('accounts').update({ balance: toBalance + Number(transaction.amount) }).eq('id', transaction.to_account_id);
      }
    }

    const { data, error } = await this.supabase.getAdminClient().from('transactions').update({
      status: newStatus, validated_by: adminId, validated_at: new Date().toISOString(), rejection_reason: dto.rejectionReason || null,
    }).eq('id', transactionId).select().single();

    if (error) throw new BadRequestException(`Failed to validate transaction: ${error.message}`);
    // Déclenche l’alerte si besoin (pour le client concerné)
    await this.alertsService.checkAndNotify(transaction.from_account_user_id || transaction.user_id, transaction.amount, 'VALIDATION');
    return data;
  }
}
