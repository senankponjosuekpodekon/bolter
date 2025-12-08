import { Injectable } from '@nestjs/common'
import { ThrottlerGuard } from '@nestjs/throttler'
import { ExecutionContext } from '@nestjs/common'

@Injectable()
export class TwoFactorThrottleGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Rate limit by userId + verification session (not just IP)
    // This prevents attackers from using multiple IPs to bypass limits
    const userId = req.user?.id || 'anonymous'
    const sessionId = req.body?.sessionId || req.cookies?.['2fa-session'] || ''
    return `${userId}:${sessionId}`
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Skip rate limiting for GET requests
    if (request.method === 'GET') {
      return true
    }

    return super.canActivate(context)
  }
}
