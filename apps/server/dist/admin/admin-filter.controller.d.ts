import { KycFilterService } from '../kyc/kyc-filter.service';
import { TransactionFilterService } from '../transactions/transaction-filter.service';
import { KycFilterDto } from '../kyc/dto/kyc-filter.dto';
import { TransactionFilterDto } from '../transactions/dto/transaction-filter.dto';
export declare class AdminFilterController {
    private readonly kycFilterService;
    private readonly transactionFilterService;
    private readonly logger;
    constructor(kycFilterService: KycFilterService, transactionFilterService: TransactionFilterService);
    filterKyc(query: KycFilterDto): Promise<import("../kyc/dto/kyc-filter.dto").KycFilterResult<Record<string, unknown>>>;
    filterTransactions(query: TransactionFilterDto): Promise<import("../transactions/dto/transaction-filter.dto").FilterResultDto<Record<string, unknown>>>;
}
