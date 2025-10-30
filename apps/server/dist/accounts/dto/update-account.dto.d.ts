import { AccountType } from './create-account.dto';
export declare const ACCOUNT_STATUSES: readonly ["ACTIVE", "FROZEN", "CLOSED"];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export declare class UpdateAccountDto {
    accountNumber?: string;
    accountType?: AccountType;
    status?: AccountStatus;
    balance?: number;
}
