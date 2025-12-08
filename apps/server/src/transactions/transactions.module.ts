import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionFilterService } from './transaction-filter.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [AccountsModule, SupabaseModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionFilterService],
  exports: [TransactionsService, TransactionFilterService],
})
export class TransactionsModule { }
