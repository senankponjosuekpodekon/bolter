import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  status?: string
  kyc_status?: string
}

interface Preferences {
  language?: string
  notificationsEnabled?: boolean
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  preferences: Preferences | null
  setAuth: (user: User, accessToken: string) => void
  setUser: (user: User) => void
  setPreferences: (preferences: Preferences) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      preferences: null,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPreferences: (preferences) => set({ preferences }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false, preferences: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
