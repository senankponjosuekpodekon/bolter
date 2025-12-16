import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT guard - allows both authenticated and unauthenticated requests
 * Useful for public endpoints that can provide additional data if user is logged in
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    handleRequest(err: any, user: any): any {
        // Return user if authenticated, null otherwise
        // Don't throw error for unauthenticated requests
        return user || null;
    }
}
