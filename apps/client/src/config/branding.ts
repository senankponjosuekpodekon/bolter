export const branding = {
  appName: import.meta.env.VITE_APP_NAME || 'Bolter Banking',
  supportEmail: import.meta.env.VITE_APP_SUPPORT_EMAIL || 'support@bolter.app',
  logoUrl: import.meta.env.VITE_APP_LOGO_URL || '',
  primaryColor: import.meta.env.VITE_APP_PRIMARY_COLOR || '#2563eb',
} as const;
