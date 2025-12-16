import { DataCleanupService } from '../services/data-cleanup.service';
export declare class CleanupTaskService {
    private dataCleanupService;
    private readonly logger;
    constructor(dataCleanupService: DataCleanupService);
    purgeSoftDeletedRecords(): Promise<void>;
    runPurgeNow(): Promise<{
        accountsPurged: number;
        usersPurged: number;
    }>;
}
