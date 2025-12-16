export declare enum PaymentMethod {
    BANK_TRANSFER = "BANK_TRANSFER",
    CARD = "CARD",
    CASH = "CASH",
    CHECK = "CHECK"
}
export declare class CreateDepositDto {
    accountId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    reference?: string;
    description?: string;
}
