import { TwoFactorThrottleGuard } from './two-factor-throttle.guard'

describe('TwoFactorThrottleGuard', () => {
  let guard: TwoFactorThrottleGuard

  beforeEach(() => {
    // Provide minimal constructor args required by ThrottlerGuard
    guard = new TwoFactorThrottleGuard({} as any, {} as any, {} as any)
  })

  it('builds a tracker key from user id and session id', async () => {
    const req = { user: { id: 'user-1' }, body: { sessionId: 'sess-123' } }
    const key = await (guard as any).getTracker(req)
    expect(key).toBe('user-1:sess-123')
  })

  it('falls back to anonymous when no user present', async () => {
    const req = { body: { sessionId: 'sess-456' } }
    const key = await (guard as any).getTracker(req)
    expect(key).toBe('anonymous:sess-456')
  })

  it('includes empty session when none present', async () => {
    const req = { user: { id: 'user-2' } }
    const key = await (guard as any).getTracker(req)
    expect(key).toBe('user-2:')
  })
})
