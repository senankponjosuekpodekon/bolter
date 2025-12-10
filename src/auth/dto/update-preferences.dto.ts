import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';

export class UpdatePreferencesDto {
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
}
