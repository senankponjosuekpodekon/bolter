import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const resolveBaseUrl = () => {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  if (!raw) {
    return '/api'
  }

  try {
    const url = new URL(raw)
    const pathname = url.pathname.replace(/\/$/, '')
    if (!pathname || pathname === '') {
      url.pathname = '/api'
    } else if (!/\/api(\/|$)/.test(pathname)) {
      url.pathname = `${pathname}/api`
    }
    return url.toString().replace(/\/$/, '')
  } catch {
    const sanitized = raw.replace(/\/$/, '')
    if (sanitized.endsWith('/api') || sanitized.includes('/api/')) {
      return sanitized
    }
    return `${sanitized}/api`
  }
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
