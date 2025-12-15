import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StorageMonitoringService } from '../common/services/storage-monitoring.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

/**
 * Admin-only endpoints for storage monitoring and alerts
 */
@ApiTags('admin/storage-monitoring')
@Controller('admin/storage')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'COMPLIANCE')
@ApiBearerAuth()
export class StorageMonitoringController {
  constructor(private readonly storageMonitoring: StorageMonitoringService) { }

  /**
   * Get all storage metrics (dashboard)
   */
  @Get('metrics')
  @ApiOperation({ summary: 'Get all storage metrics (admin only)' })
  async getMetrics() {
    return this.storageMonitoring.getAllStorageMetrics();
  }

  /**
   * Get stats for a specific bucket
   */
  @Get('buckets/:bucketName')
  @ApiOperation({ summary: 'Get bucket statistics (admin only)' })
  async getBucketStats(@Param('bucketName') bucketName: string) {
    return this.storageMonitoring.getBucketStats(bucketName);
  }

  /**
   * Get storage usage for a specific user
   */
  @Get('users/:userId')
  @ApiOperation({ summary: 'Get user storage usage (admin only)' })
  async getUserStorage(@Param('userId') userId: string) {
    return this.storageMonitoring.getUserStorageStats(userId);
  }

  /**
   * Check quota status and get alerts
   */
  @Get('quota-check')
  @ApiOperation({ summary: 'Check bucket quotas and get alerts (admin only)' })
  async checkQuotas() {
    return this.storageMonitoring.checkBucketQuotas();
  }
}
