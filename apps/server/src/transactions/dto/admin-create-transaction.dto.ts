import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from './create-deposit.dto';
import { BankDetails } from './create-withdraw.dto';

export type AdminTransactionType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';

export class AdminCreateTransactionDto {
    @ApiProperty({ enum: ['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'] })
    @IsEnum(['TRANSFER', 'DEPOSIT', 'WITHDRAWAL'])
    type: AdminTransactionType;

    @ApiProperty({ description: 'Amount of the transaction', minimum: 0.01 })
    @Type(() => Number)
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiPropertyOptional({ description: 'Currency code (defaults to EUR)', default: 'EUR' })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({ description: 'Description to attach to the transaction' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Automatically approve the transaction when created', default: true })
    @IsOptional()
    @IsBoolean()
    autoApprove?: boolean = true;

    @ApiPropertyOptional({ description: 'Account ID debited for transfers/withdrawals' })
    @ValidateIf((value) => value.type === 'TRANSFER' || value.type === 'WITHDRAWAL')
    @IsNotEmpty()
    @IsUUID()
    fromAccountId?: string;

    @ApiPropertyOptional({ description: 'Account ID credited for deposits/transfers' })
    @ValidateIf((value) => value.type === 'TRANSFER' || value.type === 'DEPOSIT')
    @IsNotEmpty()
    @IsUUID()
    toAccountId?: string;

    @ApiPropertyOptional({ description: 'External IBAN for transfers/withdrawals' })
    @ValidateIf((value) => value.type === 'TRANSFER' || value.type === 'WITHDRAWAL')
    @IsOptional()
    @IsString()
    ibanExternal?: string;

    @ApiPropertyOptional({ description: 'Payment method for deposits', enum: PaymentMethod })
    @ValidateIf((value) => value.type === 'DEPOSIT')
    @IsNotEmpty()
    @IsEnum(PaymentMethod)
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({ description: 'Payment reference for deposits' })
    @ValidateIf((value) => value.type === 'DEPOSIT')
    @IsOptional()
    @IsString()
    reference?: string;

    @ApiPropertyOptional({ description: 'Bank details for withdrawals', type: BankDetails })
    @ValidateIf((value) => value.type === 'WITHDRAWAL')
    @IsNotEmpty()
    @IsObject()
    bankDetails?: BankDetails;
}
