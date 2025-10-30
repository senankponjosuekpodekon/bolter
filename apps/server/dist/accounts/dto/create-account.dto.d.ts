export declare const ACCOUNT_TYPES: readonly ["CHECKING", "SAVINGS"];
export type AccountType = (typeof ACCOUNT_TYPES)[number];
export declare class CreateAccountDto {
    accountType?: AccountType;
}
