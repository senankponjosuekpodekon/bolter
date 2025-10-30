import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBooleanString, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class QueryTransactionsDto {
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

    @ApiPropertyOptional({ description: 'Filter by transaction status' })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional({ description: 'Filter by transaction type' })
    @IsOptional()
    @IsString()
    type?: string;

    @ApiPropertyOptional({ description: 'Filter by account involved' })
    @IsOptional()
    @IsUUID()
    accountId?: string;

    @ApiPropertyOptional({ description: 'Filter by user owner of accounts' })
    @IsOptional()
    @IsUUID()
    userId?: string;

    @ApiPropertyOptional({ description: 'Search in description or external IBAN' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Filter on auto-approved transactions', type: Boolean })
    @IsOptional()
    @IsBooleanString()
    autoApproved?: string;
}
