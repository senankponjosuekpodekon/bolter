import { SupabaseService } from '../supabase/supabase.service';
import { TransactionFilterDto, FilterResultDto } from './dto/transaction-filter.dto';
export declare class TransactionFilterService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    filter(dto: TransactionFilterDto): Promise<FilterResultDto<Record<string, unknown>>>;
}
