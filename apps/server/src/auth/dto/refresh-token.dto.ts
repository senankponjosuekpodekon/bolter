import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ required: false, description: 'Optional — browsers send the refresh token in an httpOnly cookie' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refreshToken?: string;
}
