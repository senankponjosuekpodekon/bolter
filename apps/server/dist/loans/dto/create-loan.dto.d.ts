export declare enum LoanDurationOption {
    THREE_MONTHS = 3,
    SIX_MONTHS = 6,
    TWELVE_MONTHS = 12,
    EIGHTEEN_MONTHS = 18,
    TWENTY_FOUR_MONTHS = 24
}
export declare class LoanDocumentDto {
    filename: string;
    mimeType: string;
    size: number;
    base64?: string;
    url?: string;
}
export declare class CreateLoanDto {
    amount: number;
    durationMonths: LoanDurationOption;
    purpose: string;
    monthlyIncome: number;
    employer?: string;
    notes?: string;
    documents?: LoanDocumentDto[];
}
