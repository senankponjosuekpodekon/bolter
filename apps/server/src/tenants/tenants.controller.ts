import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService, Tenant } from './tenants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List all tenants (SUPER_ADMIN only)' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Get tenant by ID (SUPER_ADMIN only)' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findById(id);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create a new tenant (SUPER_ADMIN only)' })
  create(@Body() dto: {
    name: string;
    slug: string;
    domain?: string;
    logo_url?: string;
    primary_color?: string;
    support_email?: string;
    plan?: string;
  }) {
    return this.tenantsService.create(dto);
  }

  @Patch(':id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update tenant (SUPER_ADMIN only)' })
  update(@Param('id') id: string, @Body() dto: Partial<Tenant>) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/deactivate')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Deactivate tenant (SUPER_ADMIN only)' })
  deactivate(@Param('id') id: string) {
    return this.tenantsService.deactivate(id);
  }
}
