export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  app: {
    name: process.env.APP_NAME || 'Bolter Banking',
    url: process.env.APP_URL || 'http://localhost:5173',
    supportEmail: process.env.APP_SUPPORT_EMAIL || 'support@bolter.app',
    logoUrl: process.env.APP_LOGO_URL || '',
    primaryColor: process.env.APP_PRIMARY_COLOR || '#2563eb',
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    expiresIn: parseInt(process.env.JWT_EXPIRATION, 10) || 3600,
    refreshExpiresIn: parseInt(process.env.JWT_REFRESH_EXPIRATION, 10) || 604800,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
  },
  email: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM,
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },
  frontend: {
    url: process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5173',
  },
  exchange: {
    // Live provider is only enabled when configured. Two options:
    //  - EXCHANGE_RATE_API_KEY: uses v6.exchangerate-api.com
    //  - EXCHANGE_RATE_API_URL: any compatible "latest rates" endpoint
    //    (e.g. https://open.er-api.com/v6/latest) — {base} is appended.
    apiKey: process.env.EXCHANGE_RATE_API_KEY,
    apiUrl: process.env.EXCHANGE_RATE_API_URL,
    cacheTtlMs: parseInt(process.env.EXCHANGE_RATE_CACHE_TTL_MS, 10) || 3600000,
    timeoutMs: parseInt(process.env.EXCHANGE_RATE_TIMEOUT_MS, 10) || 5000,
  },
});