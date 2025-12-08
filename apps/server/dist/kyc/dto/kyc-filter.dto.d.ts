export type KycSortField = 'date' | 'status' | 'documentType';
export type KycSortOrder = 'asc' | 'desc';
export declare class KycFilterDto {
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    documentType?: string;
    userId?: string;
    search?: string;
    sortBy?: KycSortField;
    sortOrder?: KycSortOrder;
    offset?: number;
    limit?: number;
}
export interface KycFilterResult<T> {
    total: number;
    results: T[];
    filters: Record<string, any>;
}
