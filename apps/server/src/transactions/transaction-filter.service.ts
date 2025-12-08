import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { TransactionFilterDto, FilterResultDto } from './dto/transaction-filter.dto';

@Injectable()
export class TransactionFilterService {
  constructor(private readonly supabase: SupabaseService) { }

  async filter(dto: TransactionFilterDto): Promise<FilterResultDto<any>> {
    const admin = this.supabase.getAdminClient();
    let query = admin.from('transactions').select('*', { count: 'exact' });

    if (dto.dateFrom) {
      query = query.gte('created_at', `${dto.dateFrom}T00:00:00`);
    }
    if (dto.dateTo) {
      query = query.lte('created_at', `${dto.dateTo}T23:59:59`);
    }
    if (dto.amountMin !== undefined) {
      query = query.gte('amount', dto.amountMin);
    }
    if (dto.amountMax !== undefined) {
      query = query.lte('amount', dto.amountMax);
    }
    if (dto.status) {
      const statuses = dto.status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        query = query.in('status', statuses as any);
      }
    }
    if (dto.type) {
      query = query.eq('type', dto.type);
    }
    if (dto.currency) {
      query = query.eq('currency', dto.currency);
    }
    if (dto.userId) {
      // assumes transactions table has user_id column; if not, this will be ignored at DB layer
      query = query.eq('user_id', dto.userId);
    }
    if (dto.search) {
      query = query.ilike('description', `%${dto.search}%`);
    }

    const sortFieldMap: Record<string, string> = {
      date: 'created_at',
      amount: 'amount',
      status: 'status',
      currency: 'currency',
    };
    const sortColumn = sortFieldMap[dto.sortBy ?? 'date'] ?? 'created_at';
    const sortOrder = dto.sortOrder ?? 'desc';

    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    const limit = Math.min(dto.limit ?? 25, 200);
    const offset = dto.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      throw new BadRequestException(`Failed to filter transactions: ${error.message}`);
    }

    return {
      total: count ?? 0,
      results: data ?? [],
      filters: {
        ...dto,
        sortBy: dto.sortBy ?? 'date',
        sortOrder: dto.sortOrder ?? 'desc',
        limit,
        offset,
      },
    };
  }
}
