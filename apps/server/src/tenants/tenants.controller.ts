import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantDto, UpdateTenantDto } from './dto/create-tenant.dto';

@ApiTags('Tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  /**
   * Create a new tenant (admin only)
   */
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new tenant' })
  async create(@Body() dto: CreateTenantDto, @Request() req) {
    return this.tenantsService.create(dto, req.user.id);
  }

  /**
   * Get current tenant information
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current tenant info' })
  async getCurrent(@Request() req) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }
    return this.tenantsService.getById(tenantId);
  }

  /**
   * Get tenant by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get tenant by ID' })
  async getById(@Param('id') id: string) {
    return this.tenantsService.getById(id);
  }

  /**
   * Get tenant by slug
   */
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get tenant by slug' })
  async getBySlug(@Param('slug') slug: string) {
    return this.tenantsService.getBySlug(slug);
  }

  /**
   * Get all tenants (admin only)
   */
  @Get()
  @ApiOperation({ summary: 'Get all tenants (admin)' })
  async getAll() {
    return this.tenantsService.getAll();
  }

  /**
   * Update tenant information
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update tenant' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTenantDto,
    @Request() req,
  ) {
    return this.tenantsService.update(id, dto, req.user.id);
  }

  /**
   * Get tenant statistics
   */
  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get tenant statistics' })
  async getStatistics(@Param('id') id: string) {
    return this.tenantsService.getStatistics(id);
  }

  /**
   * Suspend a tenant
   */
  @Put(':id/suspend')
  @HttpCode(200)
  @ApiOperation({ summary: 'Suspend tenant (admin)' })
  async suspend(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Request() req,
  ) {
    return this.tenantsService.suspend(id, body.reason, req.user.id);
  }

  /**
   * Reactivate a tenant
   */
  @Put(':id/reactivate')
  @HttpCode(200)
  @ApiOperation({ summary: 'Reactivate tenant (admin)' })
  async reactivate(@Param('id') id: string, @Request() req) {
    return this.tenantsService.reactivate(id, req.user.id);
  }
}
