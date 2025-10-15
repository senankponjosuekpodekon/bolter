import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('accounts')
@Controller('accounts')
@UseGuards(JwtAuthGuard)
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
}
