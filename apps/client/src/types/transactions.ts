export type Account = {
    id: string;
    account_type?: string;
    account_number: string;
    currency?: string;
    balance: number | string;
};

export type TransferPayload = {
    fromAccountId: string;
    toAccountId?: string;
    ibanExternal?: string;
    amount: number;
    description?: string;
};

export type DepositPayload = {
    accountId: string;
    amount: number;
    paymentMethod: string;
    reference?: string;
    description?: string;
};

export type WithdrawPayload = {
    accountId: string;
    amount: number;
    bankDetails: {
        iban: string;
        bic?: string;
        accountHolderName: string;
    };
    description?: string;
};
