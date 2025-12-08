import api from './api'

export async function convertAmount(amount: number, from = 'EUR', to = 'EUR') {
    const res = await api.get('/exchange/convert', { params: { amount, from, to } })
    return res.data as { amount: number; rate: number | null; from: string; to: string }
}
