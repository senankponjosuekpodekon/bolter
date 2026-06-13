import { Body, Controller, Delete, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SystemConfigService } from './system-config.service';

@ApiTags('system-config')
@Controller('system-config')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SUPER_ADMIN')
@ApiBearerAuth()
export class SystemConfigController {
  constructor(private readonly service: SystemConfigService) {}

  @Get()
  @ApiOperation({ summary: 'List all system config entries (SUPER_ADMIN only)' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get one config entry by key' })
  findOne(@Param('key') key: string) {
    return this.service.findOne(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a config entry' })
  upsert(
    @Param('key') key: string,
    @Body() body: Record<string, unknown>,
    @Req() req: { user: { id: string } },
  ) {
    return this.service.upsert(key, body, req.user.id);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Delete a config entry' })
  remove(@Param('key') key: string) {
    return this.service.remove(key);
  }
}
