import { z } from 'zod'

export const transferSchema = z.object({
    fromAccountId: z.string().min(1, 'Select source account'),
    toAccountId: z.string().optional(),
    ibanExternal: z.string().optional(),
    amount: z.number().min(0.01, 'Amount must be > 0'),
    description: z.string().optional(),
}).refine((data) => Boolean(data.toAccountId) || Boolean(data.ibanExternal), {
    message: 'Provide an internal destination account or an external IBAN',
    path: ['toAccountId'],
})

export const depositSchema = z.object({
    accountId: z.string().min(1, 'Select account'),
    amount: z.number().min(0.01, 'Amount must be > 0'),
    paymentMethod: z.string().min(1),
    reference: z.string().optional(),
    description: z.string().optional(),
})

export const withdrawSchema = z.object({
    accountId: z.string().min(1, 'Select account'),
    amount: z.number().min(0.01, 'Amount must be > 0'),
    iban: z.string().min(1, 'IBAN required'),
    bic: z.string().optional(),
    accountHolderName: z.string().min(1, 'Account holder name required'),
    description: z.string().optional(),
})
