import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
export declare class SupabaseService {
    private configService;
    private supabase;
    private supabaseAdmin;
    private readonly logger;
    constructor(configService: ConfigService);
    getClient(): SupabaseClient;
    getAdminClient(): SupabaseClient;
    get supabaseClient(): SupabaseClient;
    get supabaseAdminClient(): SupabaseClient;
}
