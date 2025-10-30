import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { generateFrenchIban } from '../common/utils/account-number.util';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private supabase: SupabaseService,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  async create(data: CreateUserDto, options?: { performedBy?: string | null; metadata?: Record<string, any> }): Promise<any> {
    const { password, email, firstName, lastName, role, phone, address, status, kyc_status } = data;
    const hashedPassword = password ? await this.hashPassword(password) : null;

    const insertPayload: Record<string, any> = {
      email,
      password_hash: hashedPassword,
      first_name: firstName || null,
      last_name: lastName || null,
      role: role || 'CLIENT',
      phone: phone || null,
      address: address || null,
    };

    if (status) insertPayload.status = status;
    if (kyc_status) insertPayload.kyc_status = kyc_status;

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
      })
      .select()
      .single();

    if (accountError) {
      throw new BadRequestException(`Failed to create default account: ${accountError.message}`);
    }

    const performedBy = options?.performedBy ?? user.id;
    const action = options?.performedBy && options.performedBy !== user.id ? 'USER_CREATED' : 'USER_REGISTERED';
    const baseMetadata: Record<string, any> = {
      changes: {
        email,
        role: insertPayload.role,
        status: insertPayload.status ?? null,
      },
    };

    const successUserLog = await this.auditLogsService.log({
      userId: user.id,
      performedBy,
      action,
      resourceType: 'user',
      resourceId: user.id,
      metadata: options?.metadata ? { ...baseMetadata, ...options.metadata } : baseMetadata,
    });

    if (!successUserLog) {
      this.logger.warn(`Failed to persist audit log for user creation (${user.id})`);
    }

    const successAccountLog = await this.auditLogsService.log({
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

    if (!successAccountLog) {
      this.logger.warn(`Failed to persist audit log for default account creation (${account.id})`);
    }

    return this.mapUser(user);
  }

  async findAll(params?: { skip?: number; take?: number }): Promise<any[]> {
    const { skip = 0, take = 100 } = params || {};
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('*')
      .range(skip, skip + take - 1);
    if (error) throw new BadRequestException(`Failed to fetch users: ${error.message}`);
    return data.map(u => this.mapUser(u));
  }

  async findById(id: string, options: { includeSensitive?: boolean } = {}): Promise<any | null> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data, options) : null;
  }

  async findByEmail(email: string): Promise<any | null> {
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
    options?: { performedBy?: string | null; metadata?: Record<string, any> },
  ): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const { password, ...userData } = updateData;
    const hashedPassword = password ? await this.hashPassword(password) : undefined;

    const updatePayload: Record<string, any> = {};
    if (userData.firstName !== undefined) updatePayload.first_name = userData.firstName || null;
    if (userData.lastName !== undefined) updatePayload.last_name = userData.lastName || null;
    if (userData.phone !== undefined) updatePayload.phone = userData.phone || null;
    if (userData.address !== undefined) updatePayload.address = userData.address || null;
    if (userData.status !== undefined) updatePayload.status = userData.status;
    if (userData.kyc_status !== undefined) updatePayload.kyc_status = userData.kyc_status;
    if (userData.role !== undefined) updatePayload.role = userData.role;
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
      const success = await this.auditLogsService.log({
        userId: id,
        performedBy,
        action: 'USER_UPDATED',
        resourceType: 'user',
        resourceId: id,
        metadata: options?.metadata
          ? { ...options.metadata, changes: { ...(options.metadata?.changes ?? {}), ...updatePayload } }
          : { changes: updatePayload },
      });

      if (!success) {
        this.logger.warn(`Failed to persist audit log for user update (${id})`);
      }
    }

    return updatedUser;
  }

  async remove(id: string, options?: { performedBy?: string | null }): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    const { error } = await this.supabase.getAdminClient().from('users').delete().eq('id', id);
    if (error) throw new BadRequestException(`Failed to delete user: ${error.message}`);

    const performedBy = options?.performedBy ?? id;
    const success = await this.auditLogsService.log({
      userId: id,
      performedBy,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: id,
    });

    if (!success) {
      this.logger.warn(`Failed to persist audit log for user deletion (${id})`);
    }

    return user;
  }

  async setRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: refreshToken }).eq('id', userId);
  }

  async removeRefreshToken(userId: string): Promise<void> {
    await this.supabase.getAdminClient().from('users').update({ refresh_token: null }).eq('id', userId);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private mapUser(user: any, options: { includeSensitive?: boolean } = {}): any {
    const payload: any = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      address: user.address,
      role: user.role,
      status: user.status,
      kyc_status: user.kyc_status,
      hasPassword: Boolean(user.password_hash),
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };

    if (options.includeSensitive) {
      payload.password = user.password_hash;
      payload.refreshToken = user.refresh_token;
    }

    return payload;
  }
}
