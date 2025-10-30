export declare class QueryAuditLogsDto {
    skip?: number;
    take?: number;
    scope?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    performedBy?: string;
}
