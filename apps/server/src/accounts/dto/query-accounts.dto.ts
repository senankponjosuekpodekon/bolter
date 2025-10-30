import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAccountsDto {
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

    @ApiPropertyOptional({ description: 'Filter by user ID' })
    @IsOptional()
    @IsString()
    userId?: string;

    @ApiPropertyOptional({ description: 'Filter by status' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Free text search on account number or owner' })
    @IsOptional()
    @IsString()
    search?: string;
}
