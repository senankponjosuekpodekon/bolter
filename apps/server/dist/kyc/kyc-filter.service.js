"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KycFilterService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let KycFilterService = class KycFilterService {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async filter(dto) {
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
                query = query.in('status', statuses);
            }
        }
        if (dto.documentType) {
            query = query.eq('document_type', dto.documentType);
        }
        if (dto.userId) {
            query = query.eq('user_id', dto.userId);
        }
        if (dto.search) {
            query = query.ilike('file_path', `%${dto.search}%`);
        }
        const sortFieldMap = {
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
            throw new common_1.BadRequestException(`Failed to filter KYC documents: ${error.message}`);
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
};
exports.KycFilterService = KycFilterService;
exports.KycFilterService = KycFilterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], KycFilterService);
//# sourceMappingURL=kyc-filter.service.js.map