import { Controller, Get, Param, UseGuards, Req, Patch, Body, Post, Query, ForbiddenException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { CreateAccountDto } from './dto/create-account.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtVerifiedGuard } from '../auth/guards/jwt-verified.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { QueryAccountsDto } from './dto/query-accounts.dto';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard, JwtVerifiedGuard, RolesGuard)
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
    return this.accountsService.create(req.user.id, createAccountDto, false, req.tenant?.id);
  }

  @Post('admin/:userId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create account for a user (Admin - bypasses limits)' })
  @ApiResponse({ status: 201, description: 'Account successfully created' })
  createAccountAsAdmin(
    @Req() req,
    @Param('userId') userId: string,
    @Body() createAccountDto: CreateAccountDto,
  ) {
    return this.accountsService.create(userId, createAccountDto, true, req.tenant?.id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update account (Admin only - can edit IBAN)' })
  updateAccount(@Req() req, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(req.user.id, id, updateAccountDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete account (soft-delete with 90-day retention for RGPD compliance)' })
  @ApiResponse({ status: 200, description: 'Account marked for deletion' })
  deleteAccount(
    @Req() req,
    @Param('id') id: string,
    @Body() deleteAccountDto: DeleteAccountDto,
  ) {
    return this.accountsService.delete(req.user.id, id, deleteAccountDto);
  }

  private ensureAdminRole(role: string) {
    if (!['ADMIN', 'COMPLIANCE'].includes(role)) {
      throw new ForbiddenException('Admin privileges required');
    }
  }
}
