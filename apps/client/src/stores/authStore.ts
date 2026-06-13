import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  role: string
  locale?: string
  currency?: string
  timezone?: string
  firstName?: string
  lastName?: string
  phone?: string
  address?: string

  status?: string
  kyc_status?: string
  two_factor_enabled?: boolean
  two_factor_verified?: boolean
  preferences?: Preferences
}

interface Preferences {
  language?: string
  notificationsEnabled?: boolean
  theme?: 'light' | 'dark' | 'auto'
  widgets?: string[]
  alertThreshold?: number
  emailAlerts?: boolean
  currency?: string
  timezone?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  preferences: Preferences | null
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void
  setUser: (user: User) => void
  setPreferences: (preferences: Preferences) => void
  logout: () => void
  updatePreferences: (prefs: Partial<Preferences>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      preferences: null,
      setAuth: (user, accessToken, refreshToken = null) => set({ user, accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPreferences: (preferences) => set({ preferences }),
      logout: () => set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, preferences: null }),
      updatePreferences: (prefs) => {
        const user = get().user
        const preferences = { ...user?.preferences, ...prefs }
        set({
          user: user ? { ...user, preferences } : null,
          preferences,
        })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
