// Idempotency-Key generation for mutating API calls.
//
// The key is stable for (operation, payload) within the page session:
// - a double-click or a retry of the SAME submit reuses the same key,
//   so the backend returns the original transaction instead of duplicating it;
// - a different payload or a fresh page load produces a new key.
const sessionId =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`

const hashPayload = (payload: unknown): string => {
  const str = JSON.stringify(payload ?? {})
  // djb2 — non-cryptographic, only used for dedup stability
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  }
  return h.toString(36)
}

export const idempotencyKeyFor = (operation: string, payload: unknown): string =>
  `${sessionId}:${operation}:${hashPayload(payload)}`
