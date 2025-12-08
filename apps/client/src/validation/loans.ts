import { z } from 'zod'

export const loanRequestSchema = z.object({
    amount: z.number().min(100, 'Amount must be at least 100').max(1_000_000, 'Amount is too large'),
    durationMonths: z.number().refine((v) => [3, 6, 12, 18, 24].includes(v), { message: 'Duration must be 3, 6, 12, 18 or 24 months' }),
    purpose: z.string().min(1, 'Purpose is required').max(280, 'Purpose is too long'),
    monthlyIncome: z.number().min(1, 'Monthly income is required').max(5_000_000, 'Monthly income is too large'),
    employer: z.string().max(1024).optional(),
    notes: z.string().max(1024).optional(),
    documents: z.array(z.object({ filename: z.string(), mimeType: z.string(), size: z.number(), base64: z.string().optional(), url: z.string().optional() })).optional(),
})
