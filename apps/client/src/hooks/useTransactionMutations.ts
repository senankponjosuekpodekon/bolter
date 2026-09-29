import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'
import { idempotencyKeyFor } from '../lib/idempotency'

const post = (op: string, data: Record<string, unknown>) =>
    api.post(`/transactions/${op}`, data, {
        headers: { 'Idempotency-Key': idempotencyKeyFor(op, data) },
    }).then((res) => res.data)

export function useTransactionMutations() {
    const qc = useQueryClient()

    const invalidateTransactions = () => {
        qc.invalidateQueries({ queryKey: ['transactions'] })
        qc.invalidateQueries({ queryKey: ['accounts'] })
    }

    const createTransfer = useMutation({
        mutationFn: (data: Record<string, unknown>) => post('transfer', data),
        onSuccess: invalidateTransactions,
    })

    const createDeposit = useMutation({
        mutationFn: (data: Record<string, unknown>) => post('deposit', data),
        onSuccess: invalidateTransactions,
    })

    const createWithdraw = useMutation({
        mutationFn: (data: Record<string, unknown>) => post('withdraw', data),
        onSuccess: invalidateTransactions,
    })

    const createCardTransaction = useMutation({
        mutationFn: (data: Record<string, unknown>) => post('card', data),
        onSuccess: () => {
            invalidateTransactions()
            qc.invalidateQueries({ queryKey: ['cards'] })
        },
    })

    return { createTransfer, createDeposit, createWithdraw, createCardTransaction }
}
