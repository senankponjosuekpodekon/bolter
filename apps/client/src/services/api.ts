import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

import { normalizeApiBase } from '../lib/url'

const resolveBaseUrl = () => {
  // In development, always use /api proxy (Vite handles the forwarding)
  // This avoids CORS issues when using ngrok
  if (import.meta.env.DEV) {
    return '/api'
  }
  // In production, use the configured API URL
  return normalizeApiBase(import.meta.env.VITE_API_URL as string | undefined)
}

const api = axios.create({
  baseURL: resolveBaseUrl(),
  timeout: 15000,
  // Send the httpOnly refresh-token cookie on cross-site requests
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { accessToken, user } = useAuthStore.getState()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  const tenantId = (user as { tenant_id?: string } | null)?.tenant_id
  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Timeout or network error — reject with user-friendly message
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return Promise.reject(new Error('Request timed out. Please check your connection.'))
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'))
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    // A 401 on auth endpoints means bad credentials — surface the error,
    // don't try to refresh or redirect.
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      return Promise.reject(error)
    }

    const { logout, setAuth, user } = useAuthStore.getState()

    // If already refreshing, queue the request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          },
          reject,
        })
      })
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      // The refresh token travels in an httpOnly cookie — no body needed
      const response = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } },
      )
      const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data
      if (user) setAuth(user, newAccessToken, newRefreshToken)
      processQueue(null, newAccessToken)
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      logout()
      window.location.href = '/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

export default api
