import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AccountsService } from '../accounts/accounts.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private supabase: SupabaseService, private accountsService: AccountsService) {}

  async createTransfer(userId: string, dto: CreateTransferDto) {
    const fromAccount = await this.accountsService.findById(dto.fromAccountId);
    if (fromAccount.user_id !== userId) throw new BadRequestException('You can only transfer from your own accounts');
    if (parseFloat(fromAccount.balance) < dto.amount) throw new BadRequestException('Insufficient balance');

    const { data, error } = await this.supabase.getAdminClient().from('transactions').insert({
      from_account_id: dto.fromAccountId, to_account_id: dto.toAccountId || null, amount: dto.amount,
      currency: 'EUR', type: 'TRANSFER', status: 'PENDING', description: dto.description, iban_external: dto.ibanExternal || null,
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create transfer: ${error.message}`);
    return data;
  }

  async createDeposit(userId: string, dto: CreateDepositDto) {
    const account = await this.accountsService.findById(dto.accountId);
    if (account.user_id !== userId) throw new BadRequestException('You can only deposit to your own accounts');

    const description = dto.description || `Deposit via ${dto.paymentMethod}${dto.reference ? ` - Ref: ${dto.reference}` : ''}`;

    const { data, error } = await this.supabase.getAdminClient().from('transactions').insert({
      from_account_id: null,
      to_account_id: dto.accountId,
      amount: dto.amount,
      currency: 'EUR',
      type: 'DEPOSIT',
      status: 'PENDING',
      description,
      metadata: { paymentMethod: dto.paymentMethod, reference: dto.reference },
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create deposit: ${error.message}`);
    return data;
  }

  async createWithdraw(userId: string, dto: CreateWithdrawDto) {
    const account = await this.accountsService.findById(dto.accountId);
    if (account.user_id !== userId) throw new BadRequestException('You can only withdraw from your own accounts');
    if (parseFloat(account.balance) < dto.amount) throw new BadRequestException('Insufficient balance');

    const description = dto.description || `Withdrawal to ${dto.bankDetails.iban}`;

    const { data, error } = await this.supabase.getAdminClient().from('transactions').insert({
      from_account_id: dto.accountId,
      to_account_id: null,
      amount: dto.amount,
      currency: 'EUR',
      type: 'WITHDRAWAL',
      status: 'PENDING',
      description,
      iban_external: dto.bankDetails.iban,
      metadata: { bankDetails: dto.bankDetails },
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create withdrawal: ${error.message}`);
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
      if (transaction.type === 'TRANSFER' || transaction.type === 'WITHDRAWAL') {
        const fromAccount = await this.accountsService.findById(transaction.from_account_id);
        const currentBalance = parseFloat(fromAccount.balance);
        if (currentBalance < parseFloat(transaction.amount)) throw new BadRequestException('Insufficient balance');
        await this.supabase.getAdminClient().from('accounts').update({ balance: currentBalance - parseFloat(transaction.amount) }).eq('id', transaction.from_account_id);
      }

      if (transaction.type === 'TRANSFER' || transaction.type === 'DEPOSIT') {
        if (transaction.to_account_id) {
          const toAccount = await this.accountsService.findById(transaction.to_account_id);
          const toBalance = parseFloat(toAccount.balance);
          await this.supabase.getAdminClient().from('accounts').update({ balance: toBalance + parseFloat(transaction.amount) }).eq('id', transaction.to_account_id);
        }
      }
    }

    const { data, error } = await this.supabase.getAdminClient().from('transactions').update({
      status: newStatus, validated_by: adminId, validated_at: new Date().toISOString(), rejection_reason: dto.rejectionReason || null,
    }).eq('id', transactionId).select().single();

    if (error) throw new BadRequestException(`Failed to validate transaction: ${error.message}`);
    return data;
  }
}
