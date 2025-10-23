import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BankDetails {
  @ApiProperty({ description: 'IBAN' })
  @IsNotEmpty()
  @IsString()
  iban: string;

  @ApiProperty({ description: 'BIC/SWIFT code', required: false })
  @IsOptional()
  @IsString()
  bic?: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsNotEmpty()
  @IsString()
  accountHolderName: string;
}

export class CreateWithdrawDto {
  @ApiProperty({ description: 'Account ID to withdraw from' })
  @IsNotEmpty()
  @IsUUID()
  accountId: string;

  @ApiProperty({ description: 'Withdrawal amount', minimum: 0.01 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Bank details for withdrawal', type: BankDetails })
  @IsNotEmpty()
  @IsObject()
  bankDetails: BankDetails;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}
