import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123xyz456', description: 'Password reset token received via email' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecurePass123!', description: 'New password (minimum 8 characters)' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
