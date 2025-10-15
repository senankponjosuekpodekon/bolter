import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private supabase: SupabaseService) {}

  async create(data: CreateUserDto): Promise<any> {
    const { password, email, firstName, lastName, role } = data;
    const hashedPassword = password ? await this.hashPassword(password) : null;

    const { data: user, error } = await this.supabase.getAdminClient().from('users').insert({
      email, password_hash: hashedPassword, first_name: firstName, last_name: lastName, role: role || 'CLIENT',
    }).select().single();

    if (error) throw new BadRequestException(`Failed to create user: ${error.message}`);

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

  async findByEmail(email: string): Promise<any | null> {
    const { data, error } = await this.supabase.getAdminClient().from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw new BadRequestException(`Failed to fetch user: ${error.message}`);
    return data ? this.mapUser(data) : null;
  }

  async update(id: string, updateData: UpdateUserDto): Promise<any> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    const { password, ...userData } = updateData;
    const hashedPassword = password ? await this.hashPassword(password) : undefined;

    const updatePayload: any = {};
    if (userData.firstName) updatePayload.first_name = userData.firstName;
    if (userData.lastName) updatePayload.last_name = userData.lastName;
    if (hashedPassword) updatePayload.password_hash = hashedPassword;
    if (userData.role) updatePayload.role = userData.role;

    const { data, error } = await this.supabase.getAdminClient().from('users').update(updatePayload).eq('id', id).select().single();
    if (error) throw new BadRequestException(`Failed to update user: ${error.message}`);
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

  private mapUser(user: any): any {
    return {
      id: user.id, email: user.email, password: user.password_hash, firstName: user.first_name,
      lastName: user.last_name, role: user.role, status: user.status, kycStatus: user.kyc_status,
      refreshToken: user.refresh_token, createdAt: user.created_at, updatedAt: user.updated_at,
    };
  }
}
