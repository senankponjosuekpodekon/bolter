import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCardTransactionDto {
    @ApiProperty({ description: 'Card ID for the transaction' })
    @IsNotEmpty()
    @IsUUID()
    cardId: string;

    @ApiProperty({ description: 'Transaction amount', minimum: 0.01 })
    @IsNotEmpty()
    @IsNumber()
    @Min(0.01)
    amount: number;

    @ApiPropertyOptional({ description: 'Transaction description' })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ description: 'Merchant name' })
    @IsOptional()
    @IsString()
    merchant?: string;

    @ApiPropertyOptional({ description: 'Transaction category (e.g., groceries, gas, restaurant)' })
    @IsOptional()
    @IsString()
    category?: string;
}
