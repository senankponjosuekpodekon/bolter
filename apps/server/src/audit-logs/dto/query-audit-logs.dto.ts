import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryAuditLogsDto {
    @ApiPropertyOptional({ minimum: 0, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    skip?: number = 0;

    @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 25 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    take?: number = 25;

    @ApiPropertyOptional({ enum: ['admin'] })
    @IsOptional()
    @IsString()
    scope?: string;

    @ApiPropertyOptional({ description: 'Filter by action code' })
    @IsOptional()
    @IsString()
    action?: string;

    @ApiPropertyOptional({ description: 'Filter by entity type' })
    @IsOptional()
    @IsString()
    entityType?: string;

    @ApiPropertyOptional({ description: 'Filter by entity identifier' })
    @IsOptional()
    @IsString()
    entityId?: string;

    @ApiPropertyOptional({ description: 'Filter by user impacted' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by admin performing the action' })
    @IsOptional()
    @IsUUID()
    performedBy?: string;
}
