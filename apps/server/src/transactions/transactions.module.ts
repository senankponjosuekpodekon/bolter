import { Module } from '@nestjs/common';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';
import { AccountsModule } from '../accounts/accounts.module';
import { TransactionFilterService } from './transaction-filter.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AccountsModule, SupabaseModule, UsersModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionFilterService],
  exports: [TransactionsService, TransactionFilterService],
})
export class TransactionsModule { }
