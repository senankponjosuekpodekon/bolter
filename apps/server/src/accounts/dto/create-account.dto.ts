import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsNumber, Min, Max } from 'class-validator';

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS'] as const;
export const CURRENCIES = ['EUR', 'USD', 'GBP'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];

export class CreateAccountDto {
    @ApiPropertyOptional({ enum: ACCOUNT_TYPES, description: 'Account type to open', default: 'SAVINGS' })
    @IsOptional()
    @IsIn(ACCOUNT_TYPES, { message: 'Account type must be CHECKING or SAVINGS' })
    accountType?: AccountType;

    @ApiPropertyOptional({ enum: CURRENCIES, description: 'Account currency', default: 'EUR' })
    @IsOptional()
    @IsIn(CURRENCIES, { message: 'Currency must be EUR, USD, or GBP' })
    currency?: Currency;

    @ApiPropertyOptional({ description: 'Account spending limit', default: 1000, minimum: 100, maximum: 100000 })
    @IsOptional()
    @IsNumber()
    @Min(100, { message: 'Limit must be at least 100' })
    @Max(100000, { message: 'Limit cannot exceed 100000' })
    limit?: number;
}
