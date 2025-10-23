import { SupabaseService } from '../supabase/supabase.service';
import { UpdateAccountDto } from './dto/update-account.dto';
export declare class AccountsService {
    private supabase;
    constructor(supabase: SupabaseService);
    findByUserId(userId: string): Promise<any[]>;
    findById(id: string): Promise<any>;
    getBalance(accountId: string): Promise<number>;
    update(adminId: string, accountId: string, updateDto: UpdateAccountDto): Promise<any>;
}
