import { AuditLogsService } from './audit-logs.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
export declare class AuditLogsController {
    private readonly auditLogsService;
    constructor(auditLogsService: AuditLogsService);
    findAll(query: QueryAuditLogsDto): Promise<{
        data: any[];
        total: number;
    }>;
    findMine(req: any, query: QueryAuditLogsDto): Promise<{
        data: any[];
        total: number;
    }>;
}
