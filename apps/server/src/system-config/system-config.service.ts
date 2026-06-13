import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

export interface SystemConfigEntry {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by?: string;
}

@Injectable()
export class SystemConfigService {
  constructor(private readonly supabase: SupabaseService) {}

  async findAll(): Promise<SystemConfigEntry[]> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('system_config')
      .select('*')
      .order('key');
    if (error) throw new Error(error.message);
    return data as SystemConfigEntry[];
  }

  async findOne(key: string): Promise<SystemConfigEntry> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('system_config')
      .select('*')
      .eq('key', key)
      .single();
    if (error || !data) throw new NotFoundException(`Config key "${key}" not found`);
    return data as SystemConfigEntry;
  }

  async upsert(key: string, value: Record<string, unknown>, updatedBy: string): Promise<SystemConfigEntry> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('system_config')
      .upsert({ key, value, updated_at: new Date().toISOString(), updated_by: updatedBy })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as SystemConfigEntry;
  }

  async remove(key: string): Promise<void> {
    const { error } = await this.supabase
      .getAdminClient()
      .from('system_config')
      .delete()
      .eq('key', key);
    if (error) throw new Error(error.message);
  }
}
