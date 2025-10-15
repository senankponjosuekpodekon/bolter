import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function Dashboard() {
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

  const totalBalance = accounts?.reduce((sum: number, acc: any) => sum + parseFloat(acc.balance), 0) || 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Total Balance</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{totalBalance.toFixed(2)} €</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Accounts</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{accounts?.length || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">Transactions</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{transactions?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Transactions</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {transactions?.slice(0, 5).map((tx: any) => (
            <div key={tx.id} className="px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-900">{tx.description || 'Transaction'}</p>
                <p className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${tx.type === 'DEPOSIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} {tx.currency}
                </p>
                <p className="text-xs text-gray-500">{tx.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
