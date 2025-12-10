import { LoansService } from './loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { ApproveLoanDto } from './dto/approve-loan.dto';
import { RejectLoanDto } from './dto/reject-loan.dto';
import { RecordRepaymentDto } from './dto/record-repayment.dto';
import { QueryLoansDto } from './dto/query-loans.dto';
export declare class LoansController {
    private readonly loansService;
    constructor(loansService: LoansService);
    createLoan(req: any, dto: CreateLoanDto): Promise<any>;
    findLoans(req: any, query: QueryLoansDto): Promise<unknown>;
    findLoan(req: any, id: string): Promise<unknown>;
    getRepayments(req: any, id: string): Promise<any[]>;
    getLoanStatistics(req: any, id: string): Promise<{
        loanId: string;
        amount: number;
        totalCost: number;
        totalPaid: any;
        totalPenalties: any;
        outstandingBalance: number;
        progressPercentage: number;
        paymentsMade: number;
        expectedPayments: number;
        monthlyPayment: number;
        nextPaymentDue: string;
        onSchedule: boolean;
        status: import("./loan.constants").LoanStatus;
        repayments: {
            amount: any;
            penalty_fee: any;
            paid_at: any;
        }[];
    }>;
    recordRepayment(req: any, id: string, dto: RecordRepaymentDto): Promise<{
        loan: any;
        repayment: any;
    }>;
    approveLoan(req: any, id: string, dto: ApproveLoanDto): Promise<any>;
    rejectLoan(req: any, id: string, dto: RejectLoanDto): Promise<any>;
}
