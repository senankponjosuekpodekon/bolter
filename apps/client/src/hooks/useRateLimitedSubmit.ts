import { useState, useRef, useCallback } from 'react'

interface Options {
  cooldownMs?: number  // wait after a 429 before allowing resubmit (default 30s)
  debounceMs?: number  // min ms between any two submits (default 1000ms)
}

interface Result {
  isSubmitting: boolean
  cooldownRemaining: number  // seconds left in forced cooldown
  wrap: <T>(fn: () => Promise<T>) => Promise<T | undefined>
}

/**
 * Wraps a form submit handler with:
 * - debounce to prevent double-clicks
 * - forced cooldown after a 429 Too Many Requests response
 */
export const useRateLimitedSubmit = ({
  cooldownMs = 30_000,
  debounceMs = 1_000,
}: Options = {}): Result => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const lastSubmitAt = useRef<number>(0)
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback(
    (ms: number) => {
      const endsAt = Date.now() + ms
      setCooldownRemaining(Math.ceil(ms / 1000))

      if (cooldownTimer.current) clearInterval(cooldownTimer.current)
      cooldownTimer.current = setInterval(() => {
        const remaining = Math.ceil((endsAt - Date.now()) / 1000)
        if (remaining <= 0) {
          setCooldownRemaining(0)
          if (cooldownTimer.current) clearInterval(cooldownTimer.current)
        } else {
          setCooldownRemaining(remaining)
        }
      }, 500)
    },
    []
  )

  const wrap = useCallback(
    async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
      if (isSubmitting || cooldownRemaining > 0) return undefined

      const now = Date.now()
      if (now - lastSubmitAt.current < debounceMs) return undefined
      lastSubmitAt.current = now

      setIsSubmitting(true)
      try {
        return await fn()
      } catch (error: unknown) {
        type AxiosLike = { response?: { status?: number; headers?: Record<string, string> } }
        const e = error as AxiosLike

        if (e?.response?.status === 429) {
          // Respect Retry-After header if present, otherwise use default cooldown
          const retryAfter = e?.response?.headers?.['retry-after']
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : cooldownMs
          startCooldown(waitMs)
        }
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, cooldownRemaining, debounceMs, cooldownMs, startCooldown]
  )

  return { isSubmitting, cooldownRemaining, wrap }
}
