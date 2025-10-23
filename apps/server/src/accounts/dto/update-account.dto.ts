import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAccountDto {
  @ApiProperty({ description: 'IBAN (French format)', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^FR[0-9]{2}[0-9]{10}[A-Z0-9]{11}[0-9]{2}$/, {
    message: 'Invalid French IBAN format',
  })
  accountNumber?: string;
}
