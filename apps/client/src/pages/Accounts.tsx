import { useQuery } from '@tanstack/react-query'
import api from '../services/api'

export default function Accounts() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await api.get('/accounts')
      return response.data
    }
  })

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Accounts</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts?.map((account: any) => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{account.account_type}</h3>
                <p className="text-sm text-gray-500">{account.account_number}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${account.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {account.status}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-500">Balance</p>
              <p className="text-3xl font-bold text-gray-900">{parseFloat(account.balance).toFixed(2)} €</p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-400">Created: {new Date(account.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
