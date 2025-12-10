import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../apps/server/src/supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ActivityLogService } from '../auth/activity-log.service';

const PASSWORD_COMPLEXITY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{12,}$/;

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService, private readonly activityLogService: ActivityLogService) { }

  async create(data: CreateUserDto): Promise<any> {
    const { password, email, firstName, lastName, role } = data;
    if (password && !PASSWORD_COMPLEXITY_REGEX.test(password)) {
      throw new BadRequestException('Password must be at least 12 characters and include uppercase, lowercase, number, and special character.');
    }
    const hashedPassword = password ? await this.hashPassword(password) : null;

    const { data: user, error } = await this.supabase.getAdminClient().from('users').insert({
      email, password_hash: hashedPassword, first_name: firstName, last_name: lastName, role: role || 'CLIENT',
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create user: ${error.message}`);

    // Enregistrer le mot de passe dans l'historique
    if (hashedPassword) {
      await this.supabase.getAdminClient().from('password_history').insert({
        user_id: user.id,
        password_hash: hashedPassword,
        changed_at: new Date().toISOString(),
      });
    }

    const accountNumber = this.generateAccountNumber();
    await this.supabase.getAdminClient().from('accounts').insert({
      user_id: user.id, account_number: accountNumber, account_type: 'CHECKING', balance: 0,
    });

    return this.mapUser(user);
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<any[]> {
    const { skip = 0, take = 100 } = params || {};
    const { data, error } = await this.supabase.getAdminClient().from('users').select('*').range(skip, skip + take - 1);
    if (error) throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    return data.map(u => this.mapUser(u));
  }

  async findById(id: string): Promise<any | null> {
    const { data, error } = await this.supabase.getAdminClient().from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data) : null;
  }

  async findByEmail(email: string, includeSecrets = false): Promise<any | null> {
    const { data, error } = await this.supabase.getAdminClient().from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data, { includeSecrets }) : null;
  }

  async update(id: string, updateData: UpdateUserDto | any): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const { password, email, firstName, lastName, language, notificationsEnabled, theme, currency, timezone, locale, widgets, ...userData } = updateData;
    const hashedPassword = password ? await this.hashPassword(password) : undefined;

    const updatePayload: any = {};
    if (email) updatePayload.email = email;
    if (firstName) updatePayload.first_name = firstName;
    if (lastName) updatePayload.last_name = lastName;
    if (language) updatePayload.language = language;
    if (typeof notificationsEnabled === 'boolean') updatePayload.notifications_enabled = notificationsEnabled;
    if (hashedPassword) updatePayload.password_hash = hashedPassword;
    if (userData.role) updatePayload.role = userData.role;
    if (theme) updatePayload.theme = theme;
    if (currency) updatePayload.currency = currency;
    if (timezone) updatePayload.timezone = timezone;
    if (locale) updatePayload.locale = locale;
    if (widgets) updatePayload.widgets = widgets;

    const { data, error } = await this.supabase.getAdminClient().from('users').update(updatePayload).eq('id', id).select().single();
    if (error) throw new BadRequestException(`Failed to update user: ${error.message}`);
    if (password) {
      await this.activityLogService.log(id, 'PASSWORD_CHANGE');
    }
    return this.mapUser(data);
  }

  async remove(id: string): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { error } = await this.supabase.getAdminClient().from('users').delete().eq('id', id);
    if (error) throw new BadRequestException(`Failed to delete user: ${error.message}`);
    return user;
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: refreshToken }).eq('id', userId);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: null }).eq('id', userId);
  }

  async enableTwoFactor(userId: string, secret: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({
      two_factor_secret: secret,
      two_factor_enabled: true
    }).eq('id', userId);
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({
      two_factor_secret: null,
      two_factor_enabled: false
    }).eq('id', userId);
  }

  async getTwoFactorSecret(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('two_factor_secret')
      .eq('id', userId)
      .single();

    if (error) throw new BadRequestException(`Failed to get 2FA secret: ${error.message}`);
    return data?.two_factor_secret || null;
  }

  // Temporary 2FA secret persistence helpers used during setup -> enable flow
  async setTempTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ two_factor_temp_secret: secret }).eq('id', userId);
  }

  async getTempTwoFactorSecret(userId: string): Promise<string | null> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('two_factor_temp_secret')
      .eq('id', userId)
      .single();

    if (error) throw new BadRequestException(`Failed to get temp 2FA secret: ${error.message}`);
    return data?.two_factor_temp_secret || null;
  }

  async clearTempTwoFactorSecret(userId: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ two_factor_temp_secret: null }).eq('id', userId);
  }

  async isTwoFactorEnabled(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase.getAdminClient()
      .from('users')
      .select('two_factor_enabled')
      .eq('id', userId)
      .single();

    if (error) throw new BadRequestException(`Failed to check 2FA status: ${error.message}`);
    return data?.two_factor_enabled || false;
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private generateAccountNumber(): string {
    const countryCode = 'FR';
    const checkDigits = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const bankCode = '30004';
    const branchCode = '00001';
    const accountNumber = Math.floor(Math.random() * 10000000000).toString().padStart(11, '0');
    const key = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `${countryCode}${checkDigits}${bankCode}${branchCode}${accountNumber}${key}`;
  }

  private mapUser(user: any, opts?: { includeSecrets?: boolean }): any {
    const includeSecrets = opts?.includeSecrets === true;
    const safe = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      status: user.status,
      kycStatus: user.kyc_status,
      twoFactorEnabled: user.two_factor_enabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      locale: user.locale,
      currency: user.currency,
      timezone: user.timezone,
      theme: user.theme,
      widgets: user.widgets,
      phone: user.phone,
      address: user.address,
    } as any;

    if (includeSecrets) {
      // include internal-only fields when explicitly requested by trusted callers
      safe.password = user.password_hash;
      safe.refreshToken = user.refresh_token;
      safe.twoFactorSecret = user.two_factor_secret;
    }

    return safe;
  }
}
