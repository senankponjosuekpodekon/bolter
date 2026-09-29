import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch, Query, Headers, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { TransactionFilterService } from './transaction-filter.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { CreateCardTransactionDto } from './dto/create-card-transaction.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtVerifiedGuard } from '../auth/guards/jwt-verified.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { AdminCreateTransactionDto } from './dto/admin-create-transaction.dto';
import { TransactionFilterDto } from './dto/transaction-filter.dto';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, JwtVerifiedGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly transactionFilterService: TransactionFilterService,
  ) { }

  @Post('transfer')
  @ApiOperation({ summary: 'Create a new transfer' })
  createTransfer(
    @Req() req,
    @Body() createTransferDto: CreateTransferDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionsService.createTransfer(req.user.id, createTransferDto, idempotencyKey);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Create a deposit (requires admin validation)' })
  createDeposit(
    @Req() req,
    @Body() createDepositDto: CreateDepositDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionsService.createDeposit(req.user.id, createDepositDto, idempotencyKey);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Create a withdrawal (requires admin validation)' })
  createWithdraw(
    @Req() req,
    @Body() createWithdrawDto: CreateWithdrawDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionsService.createWithdraw(req.user.id, createWithdrawDto, idempotencyKey);
  }

  @Post('card')
  @ApiOperation({ summary: 'Create a card transaction' })
  createCardTransaction(
    @Req() req,
    @Body() createCardTransactionDto: CreateCardTransactionDto,
    @Headers('idempotency-key') idempotencyKey?: string,
  ) {
    return this.transactionsService.createCardTransaction(req.user.id, createCardTransactionDto, idempotencyKey);
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions or full ledger for admin' })
  getTransactions(@Req() req, @Query() query: QueryTransactionsDto) {
    if (query.scope === 'admin') {
      this.ensureAdminRole(req.user?.role);
      return this.transactionsService.findAllForAdmin(query, this.actorTenantId(req.user));
    }
    return this.transactionsService.findByUserId(req.user.id, {
      skip: query.skip,
      take: query.take,
    });
  }

  @Get('pending')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get pending transactions (Admin only)' })
  getPendingTransactions(@Req() req) {
    return this.transactionsService.findPending(this.actorTenantId(req.user));
  }

  @Get('pending/:id')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get pending transaction by ID (Admin only)' })
  getPendingTransaction(@Param('id') id: string) {
    return this.transactionsService.findPendingById(id);
  }

  @Get('filter')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Filter transactions with advanced criteria (Admin only)' })
  filterTransactions(@Query() query: TransactionFilterDto) {
    return this.transactionFilterService.filter(query);
  }

  @Post('admin')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Create a transaction on behalf of clients (Admin only)' })
  createAdminTransaction(@Req() req, @Body() dto: AdminCreateTransactionDto) {
    return this.transactionsService.createAdminTransaction(req.user.id, dto, this.actorTenantId(req.user));
  }

  @Patch(':id/validate')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Validate a transaction (Admin only)' })
  validateTransaction(@Req() req, @Param('id') id: string, @Body() validateDto: ValidateTransactionDto) {
    return this.transactionsService.validateTransaction(req.user.id, id, validateDto, this.actorTenantId(req.user));
  }

  // SUPER_ADMIN operates across tenants; other roles are scoped to theirs.
  private actorTenantId(user: { role?: string; tenant_id?: string | null }): string | null {
    return user?.role === 'SUPER_ADMIN' ? null : user?.tenant_id ?? null;
  }

  private ensureAdminRole(role: string) {
    if (!['ADMIN', 'COMPLIANCE'].includes(role)) {
      throw new ForbiddenException('Admin privileges required');
    }
  }
}
