import { IsEmail, IsString, IsOptional, MinLength, MaxLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const USER_ROLES = ['CLIENT', 'ADMIN', 'COMPLIANCE'] as const;
const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION', 'CLOSED'] as const;
const KYC_STATUSES = ['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;

export type UserRole = (typeof USER_ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type UserKycStatus = (typeof KYC_STATUSES)[number];

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: '+33 6 12 34 56 78' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '123 Rue Example, 75001 Paris' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({ example: 'CLIENT', enum: USER_ROLES })
  @IsOptional()
  @IsIn(USER_ROLES, { message: 'Role must be CLIENT, ADMIN, or COMPLIANCE' })
  role?: UserRole;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: USER_STATUSES })
  @IsOptional()
  @IsIn(USER_STATUSES, { message: 'Status must be a valid user status' })
  status?: UserStatus;

  @ApiPropertyOptional({ name: 'kyc_status', example: 'PENDING', enum: KYC_STATUSES })
  @IsOptional()
  @IsIn(KYC_STATUSES, { message: 'KYC status must be a valid value' })
  kyc_status?: UserKycStatus;

  @ApiPropertyOptional({ example: 'en-US', description: 'User preferred locale (IETF language tag)' })
  @IsOptional()
  @IsString()
  locale?: string;

  @ApiPropertyOptional({ example: 'EUR', description: 'User preferred currency (ISO 4217)' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Europe/Paris', description: 'User timezone (IANA timezone string)' })
  @IsOptional()
  @IsString()
  timezone?: string;
}
