import { IsNumber, IsOptional, IsPositive, IsString, Max, Min, MaxLength } from 'class-validator';

export class ApproveLoanDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  interestRate?: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  approvedAmount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  disbursementAccountId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4096)
  approvalNotes?: string;
}
