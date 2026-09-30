import { AuthProvider } from 'react-admin'

const API_URL = import.meta.env.VITE_API_URL || '/api'

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    const request = new Request(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      body: JSON.stringify({ email: username, password }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
    })
    const response = await fetch(request)
    if (response.status < 200 || response.status >= 300) {
      throw new Error(response.statusText)
    }
    const { accessToken, user } = await response.json()
    if (user.role !== 'ADMIN' && user.role !== 'COMPLIANCE' && user.role !== 'SUPER_ADMIN') {
      throw new Error('Access denied. Admin, Compliance or Super Admin role required.')
    }
    localStorage.setItem('token', accessToken)
    localStorage.setItem('user', JSON.stringify(user))
    if (user.tenant_id) {
      localStorage.setItem('tenant_id', user.tenant_id)
    }
  },
  logout: async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
    } catch {
      // Session may already be gone — clear local state anyway
    }
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('tenant_id')
    return Promise.resolve()
  },
  checkAuth: async () => {
    return localStorage.getItem('token') ? Promise.resolve() : Promise.reject()
  },
  checkError: async (error) => {
    const status = error.status
    if (status === 401 || status === 403) {
      localStorage.removeItem('token')
      return Promise.reject()
    }
    return Promise.resolve()
  },
  getIdentity: async () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : Promise.reject()
  },
  getPermissions: async () => {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user).role : Promise.reject()
  },
}
