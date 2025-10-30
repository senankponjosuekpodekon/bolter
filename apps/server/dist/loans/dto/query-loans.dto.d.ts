export declare enum LoanStatusFilter {
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED",
    IN_PROGRESS = "IN_PROGRESS",
    LATE_PAYMENT = "LATE_PAYMENT",
    PAID = "PAID"
}
export declare class QueryLoansDto {
    skip?: string;
    take?: string;
    status?: LoanStatusFilter;
    userId?: string;
    search?: string;
    scope?: string;
}
