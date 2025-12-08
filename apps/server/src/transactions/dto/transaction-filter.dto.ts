import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export type TransactionSortField = 'date' | 'amount' | 'status' | 'currency';
export type TransactionSortOrder = 'asc' | 'desc';

export class TransactionFilterDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Minimum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMin?: number;

  @ApiPropertyOptional({ description: 'Maximum amount' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  amountMax?: number;

  @ApiPropertyOptional({ description: 'Transaction status (pending, completed, rejected, cancelled, failed)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Transaction type (DEPOSIT, WITHDRAWAL, TRANSFER, ADMIN)' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ description: 'User ID' })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ description: 'Search in description or reference' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['date', 'amount', 'status', 'currency'], default: 'date' })
  @IsOptional()
  @IsEnum(['date', 'amount', 'status', 'currency'])
  sortBy?: TransactionSortField = 'date';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: TransactionSortOrder = 'desc';

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ minimum: 1, maximum: 200, default: 25 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 25;
}

export interface FilterResultDto<T> {
  total: number;
  results: T[];
  filters: Record<string, any>;
}
