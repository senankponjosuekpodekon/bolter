export type TransactionSortField = 'date' | 'amount' | 'status' | 'currency';
export type TransactionSortOrder = 'asc' | 'desc';
export declare class TransactionFilterDto {
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    status?: string;
    type?: string;
    currency?: string;
    userId?: string;
    search?: string;
    sortBy?: TransactionSortField;
    sortOrder?: TransactionSortOrder;
    offset?: number;
    limit?: number;
}
export interface FilterResultDto<T> {
    total: number;
    results: T[];
    filters: Record<string, any>;
}
