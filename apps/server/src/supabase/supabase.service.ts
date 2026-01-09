import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private supabaseAdmin: SupabaseClient;
  private readonly logger = new Logger(SupabaseService.name);

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }

    this.logger.log(`Initializing Supabase with URL: ${supabaseUrl}`);

    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    if (supabaseServiceKey) {
      this.supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    } else {
      this.logger.warn('Supabase service role key not found, using anon client for admin operations');
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getAdminClient(): SupabaseClient {
    return this.supabaseAdmin || this.supabase;
  }

  get supabaseClient(): SupabaseClient {
    return this.supabase;
  }

  get supabaseAdminClient(): SupabaseClient {
    return this.supabaseAdmin || this.supabase;
  }
}
