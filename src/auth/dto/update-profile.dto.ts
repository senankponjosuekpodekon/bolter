import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'new.email@example.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: 'Josue' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Kpodekon' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  notificationsEnabled?: boolean;
}
