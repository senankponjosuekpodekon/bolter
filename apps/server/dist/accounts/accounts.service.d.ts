import { SupabaseService } from '../supabase/supabase.service';
export declare class AccountsService {
    private supabase;
    constructor(supabase: SupabaseService);
    findByUserId(userId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    getBalance(accountId: string): Promise<number>;
}
