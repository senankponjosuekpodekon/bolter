import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  TRIAL = 'TRIAL',
  EXPIRED = 'EXPIRED',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'Acme Bank' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'acme-bank', description: 'Unique URL-friendly slug' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({ example: 'acme', required: false, description: 'Subdomain for multi-tenant deployment' })
  @IsOptional()
  @IsString()
  subdomain?: string;

  @ApiProperty({ example: 'admin@acmebank.com' })
  @IsOptional()
  @IsEmail()
  contact_email?: string;
}

export class UpdateTenantDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiProperty({ enum: TenantStatus, required: false })
  @IsOptional()
  @IsEnum(TenantStatus)
  status?: TenantStatus;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  subdomain?: string;
  contact_email?: string;
  status: TenantStatus;
  created_at: Date;
  updated_at: Date;
}
