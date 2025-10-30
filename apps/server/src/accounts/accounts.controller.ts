import { Controller, Get, Param, UseGuards, Req, Patch, Body, Post, Query, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryAccountsDto } from './dto/query-accounts.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  @Get()
  @ApiOperation({ summary: 'Get current user accounts or full list for admin' })
  getAccounts(@Req() req, @Query() query: QueryAccountsDto) {
    if (query.scope === 'admin') {
      this.ensureAdminRole(req.user?.role);
      return this.accountsService.findAll(query);
    }
    return this.accountsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get account by ID' })
  getAccount(@Param('id') id: string) {
    return this.accountsService.findById(id);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }

  @Post()
  @ApiOperation({ summary: 'Open a new account for the current user' })
  @ApiResponse({ status: 201, description: 'Account successfully created' })
  createAccount(@Req() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(req.user.id, createAccountDto);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update account (Admin only - can edit IBAN)' })
  updateAccount(@Req() req, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(req.user.id, id, updateAccountDto);
  }

  private ensureAdminRole(role: string) {
    if (!['ADMIN', 'COMPLIANCE'].includes(role)) {
      throw new ForbiddenException('Admin privileges required');
    }
  }
}
