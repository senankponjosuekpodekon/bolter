# GitHub Issues Export - Ready to Create

These issues are copied from `ROADMAP.md` and ready to be created in GitHub. Copy each markdown block below into a new GitHub issue.

---

## Sprint F: 2FA Rate Limiting & Session Binding

````markdown
# 🔐 Sprint F: 2FA Rate Limiting & Session Binding

**Epic**: Security Enhancements  
**Estimated**: 8 hours  
**Priority**: 🟡 Medium  
**Status**: 📋 TODO

## Description

Improve security of 2FA verification with rate limiting to prevent brute force attacks.

## Acceptance Criteria

- [ ] Rate limit 2FA verify attempts (max 5 per hour per user)
- [ ] Log failed attempts to audit log
- [ ] Show user "Try again in X seconds" on rate limit hit
- [ ] Send email notification on 10+ failed attempts
- [ ] Bind verification to IP/user-agent (optional)
- [ ] Implement backup codes (optional)

## Technical Tasks

1. Install `@nestjs/throttler` package
2. Create `TwoFactorThrottleGuard` extending `ThrottleGuard`
3. Apply guard to `POST /auth/2fa/verify` endpoint
4. Update `AuthService.verifyTwoFactor()` to log failed attempts
5. Create unit tests for throttle behavior
6. Create E2E test for rate limiting scenario
7. Update frontend to show rate limit message

## Files to Modify

- `src/auth/auth.service.ts` — Add attempt logging
- `src/auth/auth.controller.ts` — Add `@UseGuards(TwoFactorThrottleGuard)`
- `src/common/guards/` — Create throttle guard
- `apps/client/src/pages/TwoFactorVerify.tsx` — Show rate limit error
- `apps/client/e2e/tests/two-factor.spec.ts` — Add rate limit test

## Testing

```bash
# Backend unit tests
npm test src/auth/auth.service.spec.ts

# E2E test with rate limiting
npm run e2e -- --project=chromium
```
````

## Blockers

None

## Notes

- Throttling should be per (userId + verificationSession)
- Consider using Redis for distributed rate limiting

````

---

## Sprint G: Admin Dashboard & Audit Logs

```markdown
# 👨‍💼 Sprint G: Admin Dashboard & Audit Logs

**Epic**: Admin Tools
**Estimated**: 12 hours
**Priority**: 🟡 Medium
**Status**: 📋 TODO

## Description
Build admin interface for user management, activity auditing, and 2FA deployment statistics.

## Acceptance Criteria
- [ ] Admin dashboard accessible to users with `admin` role
- [ ] User management table (list, view, suspend, reset 2FA)
- [ ] Activity audit log viewer (searchable, filterable)
- [ ] 2FA deployment stats (% enabled, per-user status)
- [ ] Admin action audit logging (who did what when)
- [ ] Email templates for admin notifications

## Pages to Create
1. `/admin/dashboard` — Overview (stats, recent activity)
2. `/admin/users` — User management table
3. `/admin/audit` — Activity log viewer
4. `/admin/2fa-stats` — 2FA rollout dashboard

## Technical Tasks
1. Create admin routes & layout in React
2. Add `@UseGuards(AdminGuard)` to backend endpoints
3. Create `AdminService` for user management operations
4. Create `AuditLogService.search()` for filtering
5. Create `AdminController` with endpoints:
   - `GET /admin/users`
   - `POST /admin/users/:id/suspend`
   - `POST /admin/users/:id/reset-2fa`
   - `GET /admin/audit?filter=...`
   - `GET /admin/stats/2fa`

## Files to Create/Modify
**Backend**:
- `src/admin/admin.controller.ts` (new)
- `src/admin/admin.service.ts` (new)
- `src/admin/admin.module.ts` (new)
- `src/common/guards/admin.guard.ts` (new)

**Frontend**:
- `apps/client/src/pages/AdminDashboard.tsx` (new)
- `apps/client/src/pages/AdminUsers.tsx` (new)
- `apps/client/src/pages/AdminAudit.tsx` (new)
- `apps/client/src/pages/AdminStats2FA.tsx` (new)
- `apps/client/src/services/adminService.ts` (new)

## Testing
```bash
# Backend admin endpoints
npm test src/admin/admin.service.spec.ts

# Frontend admin pages
npm run test apps/client/src/pages/__tests__/AdminDashboard.test.tsx
````

## Blockers

Depends on activity-log service (already implemented)

## Notes

- Reuse existing audit log data from `src/auth/activity-log.service.ts`
- Admin actions should also be logged
- Consider pagination for large user lists

````

---

## Sprint H: CI/CD Pipeline & Automated Testing

```markdown
# 🚀 Sprint H: CI/CD Pipeline & Automated Testing

**Epic**: DevOps & Quality
**Estimated**: 8 hours
**Priority**: 🟡 Medium
**Status**: 📋 TODO

## Description
Set up GitHub Actions for automated testing and deployment.

## Acceptance Criteria
- [ ] Run unit tests on every PR (Jest for backend)
- [ ] Run E2E tests on every PR (Playwright for frontend)
- [ ] Build Docker images for backend & frontend
- [ ] Push images to Docker Hub or GitHub Container Registry
- [ ] Code coverage reports (>80% target)
- [ ] Lint checks (ESLint, TypeScript)
- [ ] All green checks required to merge

## Files to Create
1. `.github/workflows/test.yml` — Test pipeline
2. `.github/workflows/build.yml` — Build & deploy pipeline
3. `.github/workflows/lint.yml` — Code quality pipeline
4. `Dockerfile` (backend)
5. `Dockerfile` (client)
6. `docker-compose.prod.yml` — Production compose file

## Workflow Jobs

### test.yml
- Install dependencies
- Run backend unit tests (Jest)
- Run frontend unit tests (Vitest)
- Generate coverage reports
- Upload to Codecov

### build.yml
- Build Docker image for backend
- Build Docker image for client
- Push to registry
- Deploy to staging (optional)

### lint.yml
- Run ESLint
- Run TypeScript compiler
- Run Prettier formatting check

## Testing
Validate workflows by pushing to a feature branch:
```bash
git push origin feature/ci-cd-setup
# Check GitHub Actions tab for workflow runs
````

## Blockers

None

## Notes

- E2E tests require running dev servers (consider testcontainers)
- Use caching for faster builds
- Consider separate prod/dev workflows

````

---

## Sprint I: Multi-Currency & Internationalization

```markdown
# 💱 Sprint I: Multi-Currency & Internationalization

**Epic**: Localization
**Estimated**: 10 hours
**Priority**: 🟢 Low (Nice to Have)
**Status**: 📋 TODO

## Description
Support multiple currencies and complete internationalization (i18n) setup.

## Acceptance Criteria
- [ ] Users can select preferred currency (EUR, USD, GBP, JPY, etc.)
- [ ] All transactions display in user's preferred currency
- [ ] Real-time currency conversion (using external API)
- [ ] Complete French/English localization
- [ ] Regional number/date formatting
- [ ] Currency symbols and formatting per locale

## Technical Tasks
1. Add `user.preferred_currency` to schema
2. Create currency conversion service (OpenExchangeRates, Fixer.io)
3. Add currency selector to preferences page
4. Update transaction display to use `user.preferred_currency`
5. Update i18n keys for currencies
6. Implement locale-aware number/date formatting

## APIs
- OpenExchangeRates: https://openexchangerates.org/
- Fixer.io: https://fixer.io/
- (Choose based on pricing & availability)

## Files to Create/Modify
**Backend**:
- `src/users/schemas/user.schema.ts` — Add currency field
- `src/transactions/currency.service.ts` (new)
- Database migration

**Frontend**:
- `apps/client/src/services/currencyService.ts` (new)
- `apps/client/src/pages/Preferences.tsx` — Add currency picker
- `apps/client/src/hooks/useCurrency.ts` (new)

## Testing
```bash
npm test src/transactions/currency.service.spec.ts
npm run test apps/client/src/services/currencyService.test.ts
````

## Blockers

None

## Notes

- Cache exchange rates for 1 hour to avoid API quota issues
- Consider using Dinero.js for currency arithmetic

````

---

## Sprint J: Notifications & Webhooks

```markdown
# 🔔 Sprint J: Notifications & Webhooks

**Epic**: Event-Driven Architecture
**Estimated**: 8 hours
**Priority**: 🟡 Medium
**Status**: 📋 TODO

## Description
Add real-time notifications and webhook support for event-driven integrations.

## Acceptance Criteria
- [ ] Email notifications for key events
- [ ] In-app toast/bell notifications
- [ ] WebSocket real-time updates
- [ ] User notification preferences (opt-in/opt-out)
- [ ] Webhook support for external integrations
- [ ] Webhook retry logic with exponential backoff
- [ ] Webhook event logging & debugging

## Events to Support
- `user.registered` — New user signup
- `kyc.submitted` — KYC application received
- `kyc.approved/rejected` — KYC decision
- `transaction.pending` — Transaction created
- `transaction.completed` — Transaction settled
- `transaction.failed` — Transaction error
- `2fa.enabled/disabled` — 2FA status changed
- `login.successful` — Successful login from new device

## Technical Tasks
1. Implement event queue (Bull/Redis)
2. Create notification service (email + in-app)
3. Create webhook service with retry logic
4. Add WebSocket support (Socket.io already installed)
5. Create notification preferences endpoint
6. Create webhook management endpoints

## Files to Create/Modify
**Backend**:
- `src/notifications/notifications.service.ts` — Enhance
- `src/webhooks/webhooks.service.ts` (new)
- `src/webhooks/webhooks.controller.ts` (new)
- `src/events/` — Create event bus

**Frontend**:
- `apps/client/src/components/NotificationBell.tsx` (new)
- `apps/client/src/pages/NotificationPreferences.tsx` (new)
- `apps/client/src/hooks/useWebSocket.ts` (new)

## Testing
```bash
npm test src/webhooks/webhooks.service.spec.ts
npm run test apps/client/src/hooks/useWebSocket.test.ts
````

## Blockers

None

## Notes

- Use Socket.io for WebSocket (already in package.json)
- Consider Twilio for SMS notifications (future)
- Webhook signature validation using HMAC-SHA256

```

---

## How to Create Issues

1. Go to https://github.com/senankponjosuekpodekon/bolter/issues
2. Click **New Issue**
3. Copy the markdown block above into the issue body
4. Assign to yourself or team member
5. Add label: `enhancement`, `sprint-f` (or appropriate sprint)
6. Set priority and add to project board

---

## Summary

- **Sprint F**: 8h — Rate limiting for 2FA
- **Sprint G**: 12h — Admin dashboard
- **Sprint H**: 8h — CI/CD pipeline
- **Sprint I**: 10h — Multi-currency (optional)
- **Sprint J**: 8h — Notifications & webhooks

**Total**: 46 hours (6-8 working days)
```
