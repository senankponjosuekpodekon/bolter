/**
 * API Configuration
 * Centralizes all API endpoints and configuration
 */

// Get API URL from environment or default to local development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    VERIFY_2FA: '/auth/verify-2fa',
  },

  // Users
  USERS: {
    PROFILE: '/users/profile',
    UPDATE_PROFILE: '/users/profile',
    LIST: '/users',
    GET: (id: string) => `/users/${id}`,
  },

  // Transactions
  TRANSACTIONS: {
    LIST: '/transactions',
    GET: (id: string) => `/transactions/${id}`,
    CREATE: '/transactions',
    FILTER: '/transactions/filter',
  },

  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    STATS_TRANSACTIONS: '/admin/stats/transactions',
    STATS_USERS: '/admin/stats/users',
    STATS_KYC: '/admin/stats/kyc',
    STATS_TIMELINE: '/admin/stats/timeline',
  },

  // KYC
  KYC: {
    LIST: '/kyc',
    GET: (id: string) => `/kyc/${id}`,
    UPLOAD: '/kyc/upload',
    VERIFY: '/kyc/verify',
  },

  // Exchange
  EXCHANGE: {
    RATES: '/exchange/rates',
    SUPPORTED: '/exchange/supported',
    CONVERT: '/exchange/convert',
  },

  // Localization
  LOCALIZATION: {
    MESSAGES: '/localization/messages',
    TRANSLATE: '/localization/translate',
  },
};

/**
 * Get full API URL for an endpoint
 */
export function getApiUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

export default {
  API_BASE_URL,
  API_ENDPOINTS,
  getApiUrl,
};
