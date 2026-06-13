import { SupabaseService } from '../supabase/supabase.service';
export interface SystemConfigEntry {
    key: string;
    value: Record<string, unknown>;
    updated_at: string;
    updated_by?: string;
}
export declare class SystemConfigService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    findAll(): Promise<SystemConfigEntry[]>;
    findOne(key: string): Promise<SystemConfigEntry>;
    upsert(key: string, value: Record<string, unknown>, updatedBy: string): Promise<SystemConfigEntry>;
    remove(key: string): Promise<void>;
}
