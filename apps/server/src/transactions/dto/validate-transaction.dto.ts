import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateTransactionDto {
  @ApiProperty() @IsBoolean() approved: boolean;
  @ApiPropertyOptional() @IsString() @IsOptional() rejectionReason?: string;
}
