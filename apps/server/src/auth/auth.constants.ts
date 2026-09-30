import { CookieOptions } from 'express';

export const REFRESH_TOKEN_COOKIE = 'refresh_token';

/**
 * Options for the httpOnly refresh-token cookie.
 *
 * Production is cross-site (Vercel frontend -> Render API) so the cookie must
 * be SameSite=None + Secure. In development the Vite proxy makes the API
 * same-origin, so Lax is enough and Secure must stay off (plain http).
 */
export function refreshCookieOptions(isProd: boolean, maxAgeSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: maxAgeSeconds * 1000,
  };
}
