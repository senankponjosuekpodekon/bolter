# Two-Factor Authentication (2FA) Implementation

## Overview

This document describes the 2FA implementation using Time-based One-Time Password (TOTP) authentication with speakeasy.

## Architecture

### Database Schema

The users table has been extended with:

- `two_factor_secret` (text, nullable): The permanent 2FA secret, set only when 2FA is enabled.
- `two_factor_temp_secret` (text, nullable): A temporary secret used during the setup → enable flow (persisted in DB between these two endpoints).
- `two_factor_enabled` (boolean, default false): Indicates if 2FA is enabled for the user.

### API Endpoints

#### 1. Setup 2FA

**POST /auth/2fa/setup**

Initiates 2FA setup by generating a secret and QR code.

**Request:**

```json
{}
```

**Response:**

```json
{
  "secret": "JBSWY3DPEBLW64TMMQ==",
  "qrCodeUrl": "data:image/png;base64,..."
}
```

**Flow:**

1. Server generates a new TOTP secret using speakeasy
2. Secret is persisted to DB as `two_factor_temp_secret`
3. QR code is generated from the secret's otpauth_url
4. Both secret and QR are returned to client for user confirmation

#### 2. Enable 2FA

**POST /auth/2fa/enable**

Verifies the TOTP code and permanently enables 2FA.

**Request:**

```json
{
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true
}
```

**Flow:**

1. Server retrieves the `two_factor_temp_secret` from DB (persisted by setup)
2. TOTP token is verified against the temp secret
3. If valid:
   - `two_factor_secret` is set to the temp secret
   - `two_factor_temp_secret` is cleared
   - `two_factor_enabled` is set to true
4. If invalid: error is returned, temp secret remains for retry

#### 3. Disable 2FA

**POST /auth/2fa/disable**

Disables 2FA after verifying the current TOTP code.

**Request:**

```json
{
  "token": "123456"
}
```

**Response:**

```json
{
  "success": true
}
```

**Flow:**

1. Server retrieves the permanent `two_factor_secret`
2. TOTP token is verified against this secret
3. If valid:
   - `two_factor_secret` is cleared
   - `two_factor_enabled` is set to false
4. If invalid: error is returned

#### 4. Login with 2FA

**POST /auth/login**

Standard login endpoint adapted to handle 2FA.

**Request (first):**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (if 2FA enabled):**

```json
{
  "requiresTwoFactor": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "CLIENT"
  }
}
```

**Request (second, with 2FA):**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "twoFactorToken": "123456"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "role": "CLIENT"
  }
}
```

## Implementation Details

### UsersService

Three new methods for managing temp secrets:

```typescript
// Store temp secret during setup
async setTempTwoFactorSecret(userId: string, secret: string): Promise<void>

// Retrieve temp secret for enable verification
async getTempTwoFactorSecret(userId: string): Promise<string | null>

// Clear temp secret after successful enable
async clearTempTwoFactorSecret(userId: string): Promise<void>
```

### AuthService

**setupTwoFactor(userId)**

- Generates secret using speakeasy.generateSecret()
- Persists temp secret to DB
- Returns secret (base32) and QR code URL

**enableTwoFactor(userId, token)**

- Retrieves temp secret from DB
- Verifies TOTP token against temp secret
- Persists permanent secret and clears temp secret on success

**verifyTwoFactor(userId, token)**

- Retrieves permanent secret from DB
- Verifies TOTP token
- Returns true if 2FA not enabled (bypass)

## Why Persist Temp Secret?

The temp secret is persisted to DB because:

1. **Setup/Enable Separation**: The user scans a QR code during setup but enters the TOTP code during enable (possibly much later). Without persistence, the server would need to re-generate the secret, causing a mismatch.

2. **Consistency**: Both setup and enable use the same secret, ensuring the TOTP code the user generates is valid.

3. **Reliability**: Server restart between setup and enable no longer causes failures.

4. **Multiple Retries**: User can retry entering the TOTP code without having to re-scan the QR.

## Testing

### Unit Tests

Located in `src/auth/auth.service.spec.ts`:

- Test secret generation and temp persistence during setup
- Test temp secret retrieval and verification during enable
- Test error cases (already enabled, invalid token, no pending setup)

### E2E Tests

Located in `apps/client/e2e/tests/two-factor.spec.ts`:

- Full flow: Register → Setup 2FA → Enable 2FA → Logout → Login with 2FA
- Invalid token rejection
- Hash navigation to 2FA tab

### Running Tests

```bash
# Unit tests
npm test -- src/auth/auth.service.spec.ts

# E2E tests
npm run test:e2e -- two-factor.spec.ts
```

## Migration

To enable 2FA, run the migration:

```bash
# Using Supabase CLI
supabase db pull
supabase migration new add_two_factor_temp_secret
# (migration already created in apps/server/migrations/0002_add_two_factor_temp_secret.sql)

# Or run directly in psql
psql <DATABASE_URL> -f apps/server/migrations/0002_add_two_factor_temp_secret.sql
```

## Security Considerations

1. **Token Window**: TOTP verification uses a window of ±2 (30-second intervals), matching standard authenticator apps.

2. **Secret Storage**: Secrets are stored in plaintext in the database. Consider:
   - Using an encryption layer (encrypted columns)
   - Restricting database access
   - Using Supabase's built-in encryption (if available)

3. **Session Binding**: Currently, 2FA verification is not bound to a specific session. For higher security:
   - Consider binding TOTP verification to IP/user-agent
   - Implement rate limiting on verify attempts

4. **Backup Codes**: Consider implementing backup codes as a fallback if the user loses access to their authenticator app.

## Future Enhancements

- [ ] Backup codes (recovery codes)
- [ ] Encrypted secret storage
- [ ] SMS/Email 2FA as alternative to TOTP
- [ ] 2FA enforcement policy (require 2FA for certain roles)
- [ ] Device trust (remember device for X days)
- [ ] Audit logging for 2FA events
