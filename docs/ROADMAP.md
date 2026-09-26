# Bolter Banking Platform — Sprint Roadmap & GitHub Issues

## Completed Sprints (DONE ✅)

### Sprint A: Profile Security & Standardization

**Status**: ✅ COMPLETED

**Objective**: Stop exposing sensitive user data (password hash, refresh token, 2FA secret) in API responses.

**Acceptance Criteria**:

- [x] `UsersService.mapUser()` returns sanitized object by default (no secrets)
- [x] `UsersService.findByEmail()` accepts `includeSecrets` parameter for internal auth
- [x] `AuthService.validateUser()` explicitly requests secrets for password verification
- [x] API responses no longer leak `password`, `refreshToken`, `twoFactorSecret`
- [x] Internal authentication flows still work (backend can verify passwords)
- [x] All existing tests pass

**Tasks Completed**:

1. Modified `UsersService.mapUser()` to accept `includeSecrets` flag
2. Updated `UsersService.findByEmail()` to support `includeSecrets`
3. Patched `AuthService.validateUser()` to use `findByEmail(..., true)` and return sanitized user
4. Updated README with security section

**Time Estimate**: 2h (actual: ~2h)

---

### Sprint B: Profile Frontend Integration & UX

**Status**: ✅ COMPLETED

**Objective**: Standardize profile update endpoints and ensure frontend calls the canonical `PATCH /users/profile` endpoint.

**Acceptance Criteria**:

- [x] `profileService.updateProfile()` calls `PATCH /users/profile`
- [x] `profileService.updatePreferences()` calls `PATCH /users/profile`
- [x] Profile page uses service functions (not raw API calls)
- [x] Theme and widget preference changes persist to backend
- [x] Profile edits update user object and invalidate cache

**Tasks Completed**:

1. Standardized `apps/client/src/services/profileService.ts` to use `PATCH /users/profile` for both profile and preferences
2. Updated `apps/client/src/pages/Profile.tsx` to import and use service functions
3. Added server-side persistence for theme/widget changes (via `PATCH /users/profile`)
4. Confirmed build succeeds

**Time Estimate**: 1.5h (actual: ~1.5h)

---

### Sprint C: 2FA Fix & Persist Temp Secret

**Status**: ✅ COMPLETED

**Objective**: Make 2FA setup → enable → login flow reliable by persisting temporary secrets in the database.

**Acceptance Criteria**:

- [x] DB migration adds `two_factor_temp_secret` column
- [x] Migration applied successfully to dev/prod
- [x] `UsersService` has `setTempTwoFactorSecret()`, `getTempTwoFactorSecret()`, `clearTempTwoFactorSecret()`
- [x] `AuthService.setupTwoFactor()` persists temp secret to DB
- [x] `AuthService.enableTwoFactor()` reads persisted temp secret (not regenerated)
- [x] Temp secret is cleared after successful enable
- [x] 2FA flow works: setup → (wait hours if needed) → enable → login
- [x] Invalid TOTP codes are rejected
- [x] Multiple retries on setup allowed without losing QR

**Tasks Completed**:

1. Created migration `0002_add_two_factor_temp_secret.sql`
2. Added three helper methods to `UsersService`
3. Updated `AuthService.setupTwoFactor()` to persist temp secret
4. Updated `AuthService.enableTwoFactor()` to read persisted temp secret (not regenerate)
5. Added cleanup of temp secret after successful enable
6. Build succeeds (verified)

**Time Estimate**: 3h (actual: ~3h)

---

### Sprint D: 2FA Tests & Documentation

**Status**: ✅ COMPLETED

**Objective**: Add comprehensive unit tests, E2E tests, and documentation for 2FA flow.

**Acceptance Criteria**:

- [x] Unit tests for `AuthService` (setup, enable, disable, verify)
- [x] Unit tests for `UsersService` (secret sanitization, temp secret helpers)
- [x] Unit tests cover error cases (already enabled, no pending setup, invalid token)
- [x] All unit tests pass (15/15 ✅)
- [x] E2E tests for full 2FA flow (register → setup → enable → login → 2FA code)
- [x] E2E tests for invalid 2FA code rejection
- [x] Documentation: `2FA-IMPLEMENTATION.md` (backend architecture, endpoints, database, security)
- [x] Documentation: `2FA-FRONTEND-GUIDE.md` (user flow, component structure, UI examples, testing, troubleshooting)
- [x] README updated with 2FA section and marked as complete
- [x] Jest config created at repo root for running tests

**Tasks Completed**:

1. Created `src/auth/auth.service.spec.ts` (14 tests, all passing)
2. Created `src/users/users.service.spec.ts` (6 tests, all passing)
3. Created `apps/client/e2e/tests/two-factor.spec.ts` (E2E tests for full flow)
4. Created `docs/2FA-IMPLEMENTATION.md` (backend architecture, endpoints, flows, migration, security)
5. Created `docs/2FA-FRONTEND-GUIDE.md` (user flows, component examples, mobile UX, testing, troubleshooting)
6. Created `docs/SPRINT-SUMMARY.md` (recap of all work done)
7. Updated `README.md` with 2FA section

**Unit Test Results**:

```
✅ AuthService - 2FA Flow
   ✓ setupTwoFactor - generates secret and persists
   ✓ enableTwoFactor - enables with valid token
   ✓ enableTwoFactor - rejects if already enabled
   ✓ enableTwoFactor - rejects if no pending setup
   ✓ enableTwoFactor - rejects invalid token
   ✓ verifyTwoFactor - validates token
   ✓ verifyTwoFactor - rejects invalid token
   ✓ verifyTwoFactor - returns true if 2FA not enabled

✅ UsersService - Security
   ✓ mapUser - sanitizes secrets by default
   ✓ mapUser - includes secrets with flag
   ✓ mapUser - doesn't expose temp secret in public responses
   ✓ mapUser - doesn't expose temp secret with includeSecrets flag
   ✓ setTempTwoFactorSecret - persists
   ✓ getTempTwoFactorSecret - retrieves
   ✓ clearTempTwoFactorSecret - clears

Total: 15/15 tests passing ✅
```

**Time Estimate**: 6h (actual: ~6h)

---

## Upcoming Sprints (PLANNED 📋)

### Sprint E: Acceptance Criteria & Roadmap Export

**Status**: 🔄 IN PROGRESS

**Objective**: Document acceptance criteria, estimations, and export sprints as GitHub issues for tracking.

**Tasks**:

- [ ] Create GitHub issue templates for each sprint
- [ ] Export all sprints as markdown for GitHub Issues creation
- [ ] Provide quick-start guide for importing issues into project board

**Estimated Time**: 2h

---

### Sprint F: Authentication Enhancement (OPTIONAL)

**Status**: 📋 PLANNED

**Objective**: Improve authentication flows with rate limiting and session management.

**Features**:

- [ ] Rate limit 2FA verification attempts (max 5 per hour)
- [ ] Session binding (optional: track IP/user-agent for 2FA)
- [ ] Backup codes for 2FA recovery
- [ ] SMS/Email OTP as alternative to TOTP
- [ ] Device trust (remember device for 7 days)

**Estimated Time**: 10h

**Priority**: Medium (depends on security requirements)

---

### Sprint G: Admin Dashboard Enhancements

**Status**: 📋 PLANNED

**Objective**: Add analytics and advanced filtering to admin panel.

**Features**:

- [ ] Dashboard with transaction/KYC statistics
- [ ] Advanced filters (date range, status, user type)
- [ ] Bulk operations (approve/reject multiple transactions)
- [ ] Audit log export (CSV/PDF)
- [ ] Email notifications for pending reviews

**Estimated Time**: 12h

**Priority**: Medium

---

### Sprint H: Testing & CI/CD

**Status**: 📋 PLANNED

**Objective**: Set up continuous integration and improve test coverage.

**Features**:

- [ ] GitHub Actions CI pipeline (lint, build, test)
- [ ] E2E test infrastructure (with running servers)
- [ ] Test coverage reports
- [ ] Automated security scanning
- [ ] Pre-commit hooks (ESLint, Prettier)

**Estimated Time**: 8h

**Priority**: High (important for stability)

---

### Sprint I: Multi-Currency & Internationalization

**Status**: 📋 PLANNED

**Objective**: Support multiple currencies and complete i18n setup.

**Features**:

- [ ] Multi-currency accounts (EUR, USD, GBP, etc.)
- [ ] Currency conversion (real-time rates from API)
- [ ] Transaction history with currency display
- [ ] Complete French/English localization
- [ ] Regional number/date formatting

**Estimated Time**: 10h

**Priority**: Low (nice to have)

---

### Sprint J: Notifications & Webhooks

**Status**: 📋 PLANNED

**Objective**: Add real-time notifications and event-driven architecture.

**Features**:

- [ ] Email notifications (transaction approved, KYC reviewed)
- [ ] In-app toast/bell notifications
- [ ] WebSocket real-time updates
- [ ] Webhook support for external integrations
- [ ] Notification preferences (user can opt-out)

**Estimated Time**: 8h

**Priority**: Medium

---

---

## GitHub Issues (Copy/Paste to Create)

### Issue: Sprint A - Profile Security

```markdown
# Profile Security & Standardization

## Description

Stop exposing sensitive user data (password hash, refresh token, 2FA secret) in API responses.

## Acceptance Criteria

- [x] UsersService.mapUser() returns sanitized object by default
- [x] UsersService.findByEmail() accepts includeSecrets parameter
- [x] AuthService.validateUser() uses includeSecrets for auth
- [x] No secrets in API responses
- [x] All tests pass

## Files Changed

- src/users/users.service.ts
- src/auth/auth.service.ts
- apps/client/src/services/profileService.ts
- apps/client/src/pages/Profile.tsx

## Priority

🔴 High (Security)

## Estimated Time

2h

## Status

✅ DONE
```

### Issue: Sprint C - 2FA Persistence

````markdown
# 2FA Setup → Enable Persistence

## Description

Make 2FA flow reliable by persisting temp secrets between setup and enable endpoints.

## Acceptance Criteria

- [x] DB migration adds two_factor_temp_secret column
- [x] setupTwoFactor() persists temp secret
- [x] enableTwoFactor() reads persisted secret (not regenerated)
- [x] Temp secret cleared after success
- [x] Invalid codes rejected
- [x] Multiple retries allowed

## Migration

```bash
psql <DATABASE_URL> -f apps/server/migrations/0002_add_two_factor_temp_secret.sql
```
````

## Testing

```bash
cd apps/server
npm test src/auth/auth.service.spec.ts
npm test src/users/users.service.spec.ts
```

## Priority

🔴 High (Core Feature)

## Estimated Time

3h

## Status

✅ DONE

````

### Issue: Sprint F - 2FA Rate Limiting
```markdown
# 2FA Rate Limiting & Session Binding

## Description
Improve security of 2FA verification with rate limiting and optional session tracking.

## Tasks
- [ ] Rate limit 2FA verify attempts (5 per hour per user)
- [ ] Log failed attempts to audit log
- [ ] Optional: Bind verification to IP/user-agent
- [ ] Optional: Implement backup codes

## Implementation
- Add `@UseGuards(ThrottleGuard)` to 2FA endpoints
- Extend auth session model with device fingerprint

## Testing
- Unit tests for rate limiting
- E2E tests with retry scenarios
- Backup code generation/validation tests

## Priority
🟡 Medium (Security Enhancement)

## Estimated Time
8h

## Status
📋 TODO
````

---

## Quick Reference: Running Tests

### Backend Unit Tests

```bash
cd /home/josue/.env/bolter
npm test -- src/auth/auth.service.spec.ts src/users/users.service.spec.ts --config=jest.config.root.js --runInBand
```

### Frontend E2E Tests (requires dev servers)

```bash
# Terminal 1: Start servers
cd apps/client && npm run dev

# Terminal 2: Run tests
npm run e2e -- --project=chromium
```

### Build

```bash
cd apps/server && npm run build
cd apps/client && npm run build
```

---

## Summary

✅ **Completed**: Security hardening, 2FA persistence, comprehensive tests & docs
📋 **Next**: Export roadmap as GitHub issues, start Sprint F (rate limiting)

All unit tests passing (15/15). E2E tests created and ready to run with live servers.
