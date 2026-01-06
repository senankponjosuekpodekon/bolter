import { IsNotEmpty, IsNumber, IsEnum, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from '../tontines.types';

export class PayTontineDto {
  @ApiProperty({ description: 'Contribution amount to pay', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod, example: 'BANK_TRANSFER' })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @ApiProperty({ description: 'Payment reference or transaction ID', example: 'TXN-12345', required: false })
  @IsOptional()
  @IsString()
  payment_reference?: string;

  @ApiProperty({ description: 'Proof of payment (file URL or description)', required: false })
  @IsOptional()
  @IsString()
  proof?: string;

  @ApiProperty({ description: 'Cycle ID for the payment', example: 'cycle-uuid' })
  @IsNotEmpty()
  @IsString()
  cycle_id: string;
}
