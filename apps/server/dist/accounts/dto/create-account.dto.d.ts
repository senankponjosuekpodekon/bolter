export declare const ACCOUNT_TYPES: readonly ["CHECKING", "SAVINGS"];
export declare const CURRENCIES: readonly ["EUR", "USD", "GBP"];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export type Currency = (typeof CURRENCIES)[number];
export declare class CreateAccountDto {
    accountType?: AccountType;
    currency?: Currency;
    limit?: number;
}
