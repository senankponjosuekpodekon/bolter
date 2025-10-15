import { useAuthStore } from '../stores/authStore'

export default function Profile() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="mt-1 text-gray-900">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">First Name</label>
            <p className="mt-1 text-gray-900">{user?.firstName || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Last Name</label>
            <p className="mt-1 text-gray-900">{user?.lastName || '-'}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Role</label>
            <p className="mt-1 text-gray-900">{user?.role}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
