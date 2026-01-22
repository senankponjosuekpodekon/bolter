import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { KycFilterService } from '../kyc/kyc-filter.service';
import { TransactionFilterService } from '../transactions/transaction-filter.service';
import { KycFilterDto } from '../kyc/dto/kyc-filter.dto';
import { TransactionFilterDto } from '../transactions/dto/transaction-filter.dto';

/**
 * Admin Filter Controller
 * Provides filtering endpoints for admin dashboard
 */
@Controller('admin/filter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFilterController {
  private readonly logger = new Logger(AdminFilterController.name);

  constructor(
    private readonly kycFilterService: KycFilterService,
    private readonly transactionFilterService: TransactionFilterService,
  ) { }

  /**
   * Filter KYC documents
   * GET /admin/filter/kyc?status=APPROVED&limit=25&offset=0
   */
  @Get('kyc')
  @HttpCode(HttpStatus.OK)
  async filterKyc(@Query() query: KycFilterDto) {
    this.logger.log(`Filtering KYC documents with params:`, query);
    return this.kycFilterService.filter(query);
  }

  /**
   * Filter transactions
   * GET /admin/filter/transactions?status=SUCCESS&limit=25&offset=0
   */
  @Get('transactions')
  @HttpCode(HttpStatus.OK)
  async filterTransactions(@Query() query: TransactionFilterDto) {
    this.logger.log(`Filtering transactions with params:`, query);
    return this.transactionFilterService.filter(query);
  }
}
