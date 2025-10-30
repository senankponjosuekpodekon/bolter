import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectLoanDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2048)
  reason: string;
}
