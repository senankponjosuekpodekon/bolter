export declare class BankDetails {
    iban: string;
    bic?: string;
    accountHolderName: string;
}
export declare class CreateWithdrawDto {
    accountId: string;
    amount: number;
    bankDetails: BankDetails;
    description?: string;
}
