import { IsEnum, IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export enum LoanStatusFilter {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  LATE_PAYMENT = 'LATE_PAYMENT',
  PAID = 'PAID',
}

export class QueryLoansDto {
  @IsOptional()
  @IsNumberString()
  skip?: string;

  @IsOptional()
  @IsNumberString()
  take?: string;

  @IsOptional()
  @IsEnum(LoanStatusFilter)
  status?: LoanStatusFilter;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  userId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsString()
  scope?: string;
}
