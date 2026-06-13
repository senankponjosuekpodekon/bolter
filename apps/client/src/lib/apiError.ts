/**
 * Extracts a user-friendly message from an axios error or any thrown value.
 */
export const getApiErrorMessage = (error: unknown, fallback = 'An unexpected error occurred'): string => {
  if (!error) return fallback

  // Our own user-friendly errors (network / timeout)
  if (error instanceof Error && !('response' in error)) {
    return error.message
  }

  type AxiosLike = {
    response?: { data?: { message?: string | string[]; error?: string }; status?: number }
    code?: string
    message?: string
  }

  const err = error as AxiosLike

  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection.'
  }

  if (!err.response) {
    return 'Network error. Please check your connection.'
  }

  const msg = err.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  if (typeof msg === 'string' && msg) return msg

  const status = err.response?.status
  if (status === 403) return 'You do not have permission to perform this action.'
  if (status === 404) return 'The requested resource was not found.'
  if (status === 429) return 'Too many requests. Please wait a moment.'
  if (status && status >= 500) return 'Server error. Please try again later.'

  return fallback
}
