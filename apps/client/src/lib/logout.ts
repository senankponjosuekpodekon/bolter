import api from '../services/api'
import { useAuthStore } from '../stores/authStore'

/**
 * Server-side logout: revokes the refresh token in the DB and clears the
 * httpOnly cookie, then resets the local auth store. The API call is
 * best-effort — local state is cleared regardless.
 */
export async function performLogout(): Promise<void> {
  try {
    await api.post('/auth/logout')
  } catch {
    // Session may already be invalid — clear local state anyway
  }
  useAuthStore.getState().logout()
}
