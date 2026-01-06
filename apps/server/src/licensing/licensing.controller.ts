import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LicensingService, LicenseTier } from './licensing.service';

@ApiTags('Licensing')
@Controller('licensing')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LicensingController {
  constructor(private licensingService: LicensingService) {}

  /**
   * Get current tenant's active license
   */
  @Get('current')
  @ApiOperation({ summary: 'Get current license' })
  async getCurrent(@Request() req) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }
    return this.licensingService.getActiveLicense(tenantId);
  }

  /**
   * Check if feature is available
   */
  @Get('features/:feature')
  @ApiOperation({ summary: 'Check if feature is available' })
  async hasFeature(@Param('feature') feature: string, @Request() req) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }
    const available = await this.licensingService.hasFeature(tenantId, feature);
    return { feature, available };
  }

  /**
   * Get all available features
   */
  @Get('available-features')
  @ApiOperation({ summary: 'Get available features' })
  async getAvailableFeatures(@Request() req) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }

    const license = await this.licensingService.getActiveLicense(tenantId);
    if (!license) {
      return { modules: {} };
    }

    return { modules: license.modules };
  }

  /**
   * Get remaining limit for a feature
   */
  @Get('limits/:feature')
  @ApiOperation({ summary: 'Get remaining limit for feature' })
  async getRemainingLimit(@Param('feature') feature: string, @Request() req) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }

    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const remaining = await this.licensingService.getRemainingLimit(tenantId, feature, currentMonth);
    return { feature, remaining, currentMonth };
  }

  /**
   * Upgrade license to new tier
   */
  @Put('upgrade')
  @HttpCode(200)
  @ApiOperation({ summary: 'Upgrade license to new tier' })
  async upgrade(
    @Body() body: { tier: LicenseTier },
    @Request() req,
  ) {
    const tenantId = req.user.tenant_id;
    if (!tenantId) {
      throw new Error('No tenant associated with user');
    }

    return this.licensingService.upgradeLicense(tenantId, body.tier, req.user.id);
  }

  /**
   * Get license status (admin endpoint for specific tenant)
   */
  @Get('tenant/:tenantId')
  @ApiOperation({ summary: 'Get license for specific tenant (admin)' })
  async getTenantLicense(@Param('tenantId') tenantId: string) {
    return this.licensingService.getActiveLicense(tenantId);
  }
}
