import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const ACCOUNT_TYPES = ['CHECKING', 'SAVINGS'] as const;

export type AccountType = (typeof ACCOUNT_TYPES)[number];

export class CreateAccountDto {
    @ApiPropertyOptional({ enum: ACCOUNT_TYPES, description: 'Account type to open', default: 'SAVINGS' })
    @IsOptional()
    @IsIn(ACCOUNT_TYPES, { message: 'Account type must be CHECKING or SAVINGS' })
    accountType?: AccountType;
}
