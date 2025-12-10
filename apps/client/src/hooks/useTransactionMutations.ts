import { useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export function useTransactionMutations() {
    const qc = useQueryClient()

    const createTransfer = useMutation({
        mutationFn: async (data: Record<string, unknown>) => (await api.post('/transactions/transfer', data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['accounts'] })
        },
    })

    const createDeposit = useMutation({
        mutationFn: async (data: Record<string, unknown>) => (await api.post('/transactions/deposit', data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['accounts'] })
        },
    })

    const createWithdraw = useMutation({
        mutationFn: async (data: Record<string, unknown>) => (await api.post('/transactions/withdraw', data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['accounts'] })
        },
    })

    const createCardTransaction = useMutation({
        mutationFn: async (data: Record<string, unknown>) => (await api.post('/transactions/card', data)).data,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['transactions'] })
            qc.invalidateQueries({ queryKey: ['accounts'] })
            qc.invalidateQueries({ queryKey: ['cards'] })
        },
    })

    return { createTransfer, createDeposit, createWithdraw, createCardTransaction }
}
