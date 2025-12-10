import { IsIn, IsNumber, IsOptional, IsString, Matches, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { ACCOUNT_TYPES, AccountType, CURRENCIES, Currency } from './create-account.dto';

export const ACCOUNT_STATUSES = ['ACTIVE', 'FROZEN', 'CLOSED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export class UpdateAccountDto {
  @ApiProperty({ description: 'IBAN (French format)', required: false })
  @Expose({ name: 'account_number' })
  @IsOptional()
  @IsString()
  @Matches(/^FR[0-9]{2}[0-9]{10}[A-Z0-9]{11}[0-9]{2}$/, {
    message: 'Invalid French IBAN format',
  })
  accountNumber?: string;

  @ApiPropertyOptional({ enum: ACCOUNT_TYPES, description: 'Account type' })
  @Expose({ name: 'account_type' })
  @IsOptional()
  @IsIn(ACCOUNT_TYPES, { message: 'Account type must be CHECKING or SAVINGS' })
  accountType?: AccountType;

  @ApiPropertyOptional({ enum: ACCOUNT_STATUSES, description: 'Account status' })
  @IsOptional()
  @IsIn(ACCOUNT_STATUSES, { message: 'Status must be ACTIVE, FROZEN, or CLOSED' })
  status?: AccountStatus;

  @ApiPropertyOptional({ description: 'Account balance (EUR)' })
  @Expose({ name: 'balance' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : value;
  })
  @IsNumber({ allowNaN: false, allowInfinity: false }, { message: 'Balance must be a numeric value' })
  balance?: number;

  @ApiPropertyOptional({ enum: CURRENCIES, description: 'Account currency' })
  @IsOptional()
  @IsIn(CURRENCIES, { message: 'Currency must be EUR, USD, or GBP' })
  currency?: Currency;

  @ApiPropertyOptional({ description: 'Account spending limit', minimum: 100, maximum: 100000 })
  @IsOptional()
  @IsNumber()
  @Min(100, { message: 'Limit must be at least 100' })
  @Max(100000, { message: 'Limit cannot exceed 100000' })
  limit?: number;
}
