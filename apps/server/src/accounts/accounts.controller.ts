import { Controller, Get, Param, UseGuards, Req, Patch, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user accounts' })
  getUserAccounts(@Req() req) {
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

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update account (Admin only - can edit IBAN)' })
  updateAccount(@Req() req, @Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(req.user.id, id, updateAccountDto);
  }
}
