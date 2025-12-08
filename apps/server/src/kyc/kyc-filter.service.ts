import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { KycFilterDto, KycFilterResult } from './dto/kyc-filter.dto';

@Injectable()
export class KycFilterService {
  constructor(private readonly supabase: SupabaseService) { }

  async filter(dto: KycFilterDto): Promise<KycFilterResult<any>> {
    const admin = this.supabase.getAdminClient();
    let query = admin.from('kyc_documents').select('*', { count: 'exact' });

    if (dto.dateFrom) {
      query = query.gte('created_at', `${dto.dateFrom}T00:00:00`);
    }
    if (dto.dateTo) {
      query = query.lte('created_at', `${dto.dateTo}T23:59:59`);
    }
    if (dto.status) {
      const statuses = dto.status.split(',').map((s) => s.trim()).filter(Boolean);
      if (statuses.length > 0) {
        query = query.in('status', statuses as any);
      }
    }
    if (dto.documentType) {
      query = query.eq('document_type', dto.documentType);
    }
    if (dto.userId) {
      query = query.eq('user_id', dto.userId);
    }
    if (dto.search) {
      // limited search to file_path to avoid column mismatches
      query = query.ilike('file_path', `%${dto.search}%`);
    }

    const sortFieldMap: Record<string, string> = {
      date: 'created_at',
      status: 'status',
      documentType: 'document_type',
    };
    const sortColumn = sortFieldMap[dto.sortBy ?? 'date'] ?? 'created_at';
    const sortOrder = dto.sortOrder ?? 'desc';
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    const limit = Math.min(dto.limit ?? 25, 200);
    const offset = dto.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) {
      throw new BadRequestException(`Failed to filter KYC documents: ${error.message}`);
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
