import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiPropertyOptional({ example: 'fr' })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiPropertyOptional({ example: 'light' })
  @IsString()
  @IsOptional()
  theme?: string;

  @ApiPropertyOptional({ example: 'EUR' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ example: 'Europe/Paris' })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiPropertyOptional({ example: 'en-US' })
  @IsString()
  @IsOptional()
  locale?: string;

  @ApiPropertyOptional({ example: ['dashboard', 'transactions'] })
  @IsArray()
  @IsOptional()
  widgets?: string[];

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

  @ApiPropertyOptional({ example: '+33612345678' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St, Paris' })
  @IsString()
  @IsOptional()
  address?: string;
}
