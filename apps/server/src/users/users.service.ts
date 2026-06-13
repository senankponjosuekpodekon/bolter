// Clean, single interface and class implementation
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  locale?: string | null;
  currency?: string | null;
  timezone?: string | null;
  role: string;
  status?: string;
  kyc_status?: string;
  hasPassword: boolean;
  two_factor_enabled?: boolean;
  preferences?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  password?: string;
  refreshToken?: string;
  tenant_id?: string | null;
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generateFrenchIban } from '../common/utils/account-number.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { NotificationsService } from '../notifications/notifications.service';

type RawUserRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  address?: string | null;
  locale?: string | null;
  currency?: string | null;
  timezone?: string | null;
  role?: string;
  status?: string;
  kyc_status?: string;
  password_hash?: string | null;
  refresh_token?: string | null;
  two_factor_enabled?: boolean;
  preferences?: Record<string, unknown> | null;
  created_at?: string | null;
  updated_at?: string | null;
  tenant_id?: string | null;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private supabase: SupabaseService,
    private readonly auditLogsService: AuditLogsService,
    private readonly notificationsService: NotificationsService,
  ) { }

  async create(data: CreateUserDto, options?: { performedBy?: string | null; tenantId?: string | null; metadata?: { changes?: Record<string, unknown>;[k: string]: unknown } }): Promise<User> {
    const { password, email, firstName, lastName, role, phone, address, status, kyc_status, locale, currency, timezone } = data;
    const hashedPassword = password ? await this.hashPassword(password) : null;
    const insertPayload: Record<string, unknown> = {
      email,
      password_hash: hashedPassword,
      first_name: firstName || null,
      last_name: lastName || null,
      role: role || 'CLIENT',
      phone: phone || null,
      address: address || null,
    };
    if (locale) insertPayload.locale = locale;
    if (currency) insertPayload.currency = currency;
    if (timezone) insertPayload.timezone = timezone;
    if (status) insertPayload.status = status;
    if (kyc_status) insertPayload.kyc_status = kyc_status;
    if (options?.tenantId) insertPayload.tenant_id = options.tenantId;
    const { data: user, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .insert(insertPayload)
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to create user: ${error.message}`);
    const accountNumber = generateFrenchIban();
    const { data: account, error: accountError } = await this.supabase
      .getAdminClient()
      .from('accounts')
      .insert({
        user_id: user.id,
        account_number: accountNumber,
        account_type: 'CHECKING',
        balance: 0,
        tenant_id: options?.tenantId ?? user.tenant_id ?? null,
      })
      .select()
      .single();
    if (accountError) {
      throw new BadRequestException(`Failed to create default account: ${accountError.message}`);
    }
    const performedBy = options?.performedBy ?? user.id;
    const action = options?.performedBy && options.performedBy !== user.id ? 'USER_CREATED' : 'USER_REGISTERED';
    const baseMetadata: Record<string, unknown> = {
      changes: {
        email,
        role: insertPayload.role,
        status: insertPayload.status ?? null,
      },
    };
    await this.auditLogsService.log({
      userId: user.id,
      performedBy,
      action,
      resourceType: 'user',
      resourceId: user.id,
      metadata: options?.metadata ? { ...baseMetadata, ...options.metadata } : baseMetadata,
    });
    await this.auditLogsService.log({
      userId: user.id,
      performedBy,
      action: 'ACCOUNT_CREATED',
      resourceType: 'account',
      resourceId: account.id,
      metadata: {
        changes: {
          accountType: 'CHECKING',
          accountNumber,
        },
      },
    });
    await this.notificationsService.notifyAccountCreated(user.id, accountNumber);
    await this.notificationsService.notifyWelcome(user.id, email);
    return this.mapUser(user);
  }

  async findAll(params?: { skip?: number; take?: number; tenantId?: string | null }): Promise<User[]> {
    const { skip = 0, take = 100, tenantId } = params || {};
    let query = this.supabase
      .getAdminClient()
      .from('users')
      .select('*');
    if (tenantId) {
      query = query.eq('tenant_id', tenantId);
    }
    const { data, error } = await query.range(skip, skip + take - 1);
    if (error) throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    return (data ?? []).map(u => this.mapUser(u));
  }

  async findById(id: string, options: { includeSensitive?: boolean } = {}): Promise<User | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data, options) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data, { includeSensitive: true }) : null;
  }

  async update(
    id: string,
    updateData: UpdateUserDto,
    options?: { performedBy?: string | null; metadata?: { changes?: Record<string, unknown>;[k: string]: unknown } },
  ): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { password, ...userData } = updateData;
    const hashedPassword = password ? await this.hashPassword(password) : undefined;
    const updatePayload: Record<string, unknown> = {};
    if (userData.firstName !== undefined) updatePayload.first_name = userData.firstName || null;
    if (userData.lastName !== undefined) updatePayload.last_name = userData.lastName || null;
    if (userData.phone !== undefined) updatePayload.phone = userData.phone || null;
    if (userData.address !== undefined) updatePayload.address = userData.address || null;
    if (userData.locale !== undefined) updatePayload.locale = userData.locale || null;
    if (userData.currency !== undefined) updatePayload.currency = userData.currency || null;
    if (userData.timezone !== undefined) updatePayload.timezone = userData.timezone || null;
    if (userData.status !== undefined) updatePayload.status = userData.status;
    if (userData.kyc_status !== undefined) updatePayload.kyc_status = userData.kyc_status;
    if (userData.role !== undefined) updatePayload.role = userData.role;
    if (userData.preferences !== undefined) updatePayload.preferences = userData.preferences ?? null;
    if (hashedPassword) updatePayload.password_hash = hashedPassword;
    if (Object.keys(updatePayload).length === 0) {
      return user;
    }
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw new BadRequestException(`Failed to update user: ${error.message}`);
    const updatedUser = this.mapUser(data);
    const performedBy = options?.performedBy ?? id;
    if (Object.keys(updatePayload).length) {
      await this.auditLogsService.log({
        userId: id,
        performedBy,
        action: 'USER_UPDATED',
        resourceType: 'user',
        resourceId: id,
        metadata: options?.metadata
          ? { ...options.metadata, changes: { ...(options.metadata?.changes ?? {}), ...updatePayload } }
          : { changes: updatePayload },
      });
    }
    return updatedUser;
  }

  async remove(id: string, options?: { performedBy?: string | null }): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { error } = await this.supabase.getAdminClient().from('users').delete().eq('id', id);
    if (error) throw new BadRequestException(`Failed to delete user: ${error.message}`);
    const performedBy = options?.performedBy ?? id;
    await this.auditLogsService.log({
      userId: id,
      performedBy,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: id,
    });
    return user;
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: refreshToken }).eq('id', userId);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: null }).eq('id', userId);
  }

  async setTwoFactorSecret(userId: string, secret: string): Promise<void> {
    try {
      const { error } = await this.supabase.getAdminClient()
        .from('users')
        .update({ two_factor_secret: secret, two_factor_enabled: true })
        .eq('id', userId);
      if (error) throw new BadRequestException(`Failed to set 2FA secret: ${error.message}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_err) {
      // If columns don't exist, try with simpler update
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { error } = await this.supabase.getAdminClient()
        .from('users')
        .update({ two_factor_secret: secret })
        .eq('id', userId);
      if (error) throw new BadRequestException(`Failed to set 2FA secret: ${error.message}`);
    }
  }

  async getTwoFactorSecret(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('two_factor_secret')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new BadRequestException(`Failed to get 2FA secret: ${error.message}`);
    return data?.two_factor_secret || null;
  }

  async setTempTwoFactorSecret(userId: string, secret: string): Promise<void> {
    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({ temp_two_factor_secret: secret })
      .eq('id', userId);
    if (error) throw new BadRequestException(`Failed to set temp 2FA secret: ${error.message}`);
  }

  async getTempTwoFactorSecret(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('temp_two_factor_secret')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new BadRequestException(`Failed to get temp 2FA secret: ${error.message}`);
    return data?.temp_two_factor_secret || null;
  }

  async clearTwoFactorSecret(userId: string): Promise<void> {
    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({ two_factor_secret: null, two_factor_enabled: false })
      .eq('id', userId);
    if (error) throw new BadRequestException(`Failed to clear 2FA secret: ${error.message}`);
  }

  async clearTempTwoFactorSecret(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase.getAdminClient()
        .from('users')
        .update({ temp_two_factor_secret: null })
        .eq('id', userId);
      if (error) throw new BadRequestException(`Failed to clear temp 2FA secret: ${error.message}`);
    } catch (err) {
      // Log but don't fail - temp secret clearing is not critical
      console.warn('Failed to clear temp 2FA secret:', err);
    }
  }

  async setPasswordResetToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({
        password_reset_token: token,
        password_reset_expires: expiresAt.toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      throw new BadRequestException(`Failed to set password reset token: ${error.message}`);
    }
  }

  async findByPasswordResetToken(token: string): Promise<(User & { password_reset_expires?: string }) | null> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('*')
      .eq('password_reset_token', token)
      .maybeSingle();
    
    if (error) {
      throw new BadRequestException(`Failed to find user by reset token: ${error.message}`);
    }
    
    return data ? { ...this.mapUser(data, { includeSensitive: true }), password_reset_expires: data.password_reset_expires } : null;
  }

  async updatePasswordAndClearResetToken(userId: string, hashedPassword: string): Promise<void> {
    const { error } = await this.supabase.getAdminClient()
      .from('users')
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expires: null,
      })
      .eq('id', userId);
    
    if (error) {
      throw new BadRequestException(`Failed to update password: ${error.message}`);
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }



  private mapUser(user: RawUserRow, options: { includeSensitive?: boolean } = {}): User {
    const payload: User = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      locale: user.locale,
      currency: user.currency,
      timezone: user.timezone,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      kyc_status: user.kyc_status,
      hasPassword: Boolean(user.password_hash),
      two_factor_enabled: Boolean(user.two_factor_enabled ?? false),
      preferences: user.preferences ?? null,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      tenant_id: user.tenant_id ?? null,
    };
    if (options.includeSensitive) {
      payload.password = user.password_hash;
      payload.refreshToken = user.refresh_token;
    }
    return payload;
  }
}
