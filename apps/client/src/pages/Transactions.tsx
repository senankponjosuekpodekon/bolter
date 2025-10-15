import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../services/api'

export default function Transactions() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    description: '',
    ibanExternal: ''
  })

  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts')
      return response.data
    }
  })

  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get('/transactions')
      return response.data
    }
  })

  const createTransfer = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/transactions/transfer', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setShowForm(false)
      setFormData({ fromAccountId: '', toAccountId: '', amount: '', description: '', ibanExternal: '' })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createTransfer.mutate({
      fromAccountId: formData.fromAccountId,
      toAccountId: formData.toAccountId || undefined,
      amount: parseFloat(formData.amount),
      description: formData.description,
      ibanExternal: formData.ibanExternal || undefined
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          New Transfer
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium mb-4">Create Transfer</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">From Account</label>
              <select
                required
                value={formData.fromAccountId}
                onChange={(e) => setFormData({...formData, fromAccountId: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select account</option>
                {accounts?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.account_number} - {acc.balance} €</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">To Account (or IBAN below)</label>
              <select
                value={formData.toAccountId}
                onChange={(e) => setFormData({...formData, toAccountId: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select account</option>
                {accounts?.map((acc: any) => (
                  <option key={acc.id} value={acc.id}>{acc.account_number}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">External IBAN (optional)</label>
              <input
                type="text"
                value={formData.ibanExternal}
                onChange={(e) => setFormData({...formData, ibanExternal: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="FR7630004000010001234567890"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Amount (€)</label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={createTransfer.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                {createTransfer.isPending ? 'Creating...' : 'Create Transfer'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions?.map((tx: any) => (
              <tr key={tx.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(tx.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tx.description || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {tx.amount} {tx.currency}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
