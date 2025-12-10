import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';
import { QueryLoansDto } from './dto/query-loans.dto';

@ApiTags('loans')
@ApiBearerAuth()
@Controller('loans')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new loan request' })
  createLoan(@Req() req, @Body() dto: CreateLoanDto) {
    return this.loansService.createLoan(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List loan requests for current user or admin scope' })
  findLoans(@Req() req, @Query() query: QueryLoansDto): Promise<unknown> {
    return this.loansService.findLoans(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single loan' })
  findLoan(@Req() req, @Param('id') id: string): Promise<unknown> {
    return this.loansService.findLoanById(id, req.user);
  }

  @Get(':id/repayments')
  @ApiOperation({ summary: 'List repayments for a loan' })
  getRepayments(@Req() req, @Param('id') id: string) {
    return this.loansService.getRepayments(id, req.user);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get loan statistics and repayment progress' })
  getLoanStatistics(@Req() req, @Param('id') id: string) {
    return this.loansService.getLoanStatistics(id, req.user);
  }

  @Post(':id/repayments')
  @ApiOperation({ summary: 'Record a loan repayment' })
  recordRepayment(@Req() req, @Param('id') id: string, @Body() dto: RecordRepaymentDto) {
    return this.loansService.recordRepayment(req.user.id, id, dto);
  }

  @Patch(':id/approve')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Approve a loan request (Admin only)' })
  approveLoan(@Req() req, @Param('id') id: string, @Body() dto: ApproveLoanDto) {
    return this.loansService.approveLoan(req.user.id, id, dto);
  }

  @Patch(':id/reject')
  @Roles('ADMIN', 'COMPLIANCE')
  @ApiOperation({ summary: 'Reject a loan request (Admin only)' })
  rejectLoan(@Req() req, @Param('id') id: string, @Body() dto: RejectLoanDto) {
    return this.loansService.rejectLoan(req.user.id, id, dto);
  }

}
