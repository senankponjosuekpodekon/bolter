import { PaymentMethod } from './create-deposit.dto';
import { BankDetails } from './create-withdraw.dto';
export type AdminTransactionType = 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL';
export declare class AdminCreateTransactionDto {
    type: AdminTransactionType;
    amount: number;
    currency?: string;
    description?: string;
    autoApprove?: boolean;
    fromAccountId?: string;
    toAccountId?: string;
    ibanExternal?: string;
    paymentMethod?: PaymentMethod;
    reference?: string;
    bankDetails?: BankDetails;
}
