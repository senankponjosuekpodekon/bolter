import { IsNumber, IsString, IsPositive, Max } from 'class-validator';

export class ConversionRequestDto {
    @IsNumber()
    @IsPositive()
    @Max(999999999)
    amount: number;

    @IsString()
    from: string;

    @IsString()
    to: string;
}
