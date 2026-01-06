import { PaymentMethod } from '../tontines.types';
export declare class PayTontineDto {
    amount: number;
    payment_method: PaymentMethod;
    payment_reference?: string;
    proof?: string;
    cycle_id: string;
}
