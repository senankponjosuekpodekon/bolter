import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  CASH = 'CASH',
  CHECK = 'CHECK',
}

export class CreateDepositDto {
  @ApiProperty({ description: 'Account ID to deposit to' })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'Deposit amount', minimum: 0.01 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment reference', required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
