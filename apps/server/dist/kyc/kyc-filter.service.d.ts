import { SupabaseService } from '../supabase/supabase.service';
import { KycFilterDto, KycFilterResult } from './dto/kyc-filter.dto';
export declare class KycFilterService {
    private readonly supabase;
    constructor(supabase: SupabaseService);
    filter(dto: KycFilterDto): Promise<KycFilterResult<any>>;
}
