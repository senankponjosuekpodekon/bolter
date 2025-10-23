import { Controller, Get, Post, Body, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CreateWithdrawDto } from './dto/create-withdraw.dto';
import { ValidateTransactionDto } from './dto/validate-transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Create a new transfer' })
  createTransfer(@Req() req, @Body() createTransferDto: CreateTransferDto) {
    return this.transactionsService.createTransfer(req.user.id, createTransferDto);
  }

  @Post('deposit')
  @ApiOperation({ summary: 'Create a deposit (requires admin validation)' })
  createDeposit(@Req() req, @Body() createDepositDto: CreateDepositDto) {
    return this.transactionsService.createDeposit(req.user.id, createDepositDto);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'Create a withdrawal (requires admin validation)' })
  createWithdraw(@Req() req, @Body() createWithdrawDto: CreateWithdrawDto) {
    return this.transactionsService.createWithdraw(req.user.id, createWithdrawDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user transactions' })
  getUserTransactions(@Req() req) {
    return this.transactionsService.findByUserId(req.user.id);
  }

  @Get('pending')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Get pending transactions (Admin only)' })
  getPendingTransactions() {
    return this.transactionsService.findPending();
  }

  @Patch(':id/validate')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Validate a transaction (Admin only)' })
  validateTransaction(@Req() req, @Param('id') id: string, @Body() validateDto: ValidateTransactionDto) {
    return this.transactionsService.validateTransaction(req.user.id, id, validateDto);
  }
}
