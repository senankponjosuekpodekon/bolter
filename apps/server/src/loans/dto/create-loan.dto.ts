import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export enum LoanDurationOption {
  THREE_MONTHS = 3,
  SIX_MONTHS = 6,
  TWELVE_MONTHS = 12,
  EIGHTEEN_MONTHS = 18,
  TWENTY_FOUR_MONTHS = 24,
}

export class LoanDocumentDto {
  @IsString()
  @IsNotEmpty()
  filename: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsPositive()
  size: number;

  @IsOptional()
  @IsString()
  @MaxLength(5_000_000)
  base64?: string;

  @IsOptional()
  @IsString()
  url?: string;
}

export class CreateLoanDto {
  @IsNumber()
  @IsPositive()
  @Max(1_000_000)
  amount: number;

  @IsEnum(LoanDurationOption)
  durationMonths: LoanDurationOption;

  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  purpose: string;

  @IsNumber()
  @IsPositive()
  @Max(5_000_000)
  monthlyIncome: number;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  employer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  notes?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(0)
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => LoanDocumentDto)
  documents?: LoanDocumentDto[];
}
