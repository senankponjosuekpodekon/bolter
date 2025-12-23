# 🎯 ACTION ITEMS CONCRETS - Priorisation Par Sprint

## SPRINT 1 (Cette semaine - 5-7 jours)

### 🔴 BLOCKER 1: Docker & Deployment
**Effort**: 1 jour | **Impact**: CRITIQUE

```bash
[ ] Créer Dockerfile (server, client, admin)
[ ] Créer docker-compose.yml (app + postgres + redis)
[ ] Tester build localement
[ ] Documenter docker setup (README_DOCKER.md)
[ ] Ajouter .dockerignore
```

**Files à créer**:
- `Dockerfile.server`
- `Dockerfile.client`
- `Dockerfile.admin`
- `docker-compose.yml`
- `.dockerignore`

---

### 🔴 BLOCKER 2: Tontines - Paiements (Endpoint)
**Effort**: 2 jours | **Impact**: CRITIQUE

```bash
Backend:
[ ] Créer TontinePaymentDto (montant, method, proof)
[ ] POST /tontines/:id/pay endpoint
  - Vérifier solde compte utilisateur
  - Créer transaction interne (debit + ledger)
  - Créer enregistrement payment dans tontine_payments
  - Notifier autres membres
[ ] Ajouter JwtVerifiedGuard (force 2FA)
[ ] Tests unitaires (payment success/fail)

Frontend:
[ ] Créer modal PaymentTontine.tsx
  - Input montant (disabled, issu de schedule)
  - Select method (card, account transfer, wallet)
  - Button confirmer (appelle POST)
[ ] Intégrer dans TontineDetailPage
[ ] Toast notifications (success/error)
```

**Files à créer/modifier**:
- `apps/server/src/tontines/dto/tontine-payment.dto.ts` (NEW)
- `apps/server/src/tontines/tontines.controller.ts` (+pay endpoint)
- `apps/server/src/tontines/tontines.service.ts` (+payTontine method)
- `apps/client/src/components/modals/PaymentTontineModal.tsx` (NEW)
- `apps/server/src/tontines/tontines.service.spec.ts` (+payment tests)

---

### 🔴 BLOCKER 3: WebSocket Notifications (Infrastructure)
**Effort**: 2 jours | **Impact**: HAUTE

```bash
Backend:
[ ] npm install socket.io
[ ] Créer WebSocket gateway (NestJS)
[ ] Connecter utilisateurs par ID
[ ] Événements: 'payment_received', 'transaction_alert', 'member_joined'
[ ] Broadcaster service (send to room/user)

Frontend:
[ ] npm install socket.io-client
[ ] Hook useNotifications.ts
  - Connect on mount
  - Listen events
  - Dispatch to Zustand store
[ ] Integrate into Layout (show toast on event)
```

**Files à créer**:
- `apps/server/src/websocket/websocket.gateway.ts`
- `apps/server/src/websocket/websocket.module.ts`
- `apps/server/src/websocket/websocket.service.ts`
- `apps/client/src/hooks/useNotifications.ts`
- `apps/server/src/app.module.ts` (add WebSocketModule)

---

### ⚠️ IMPORTANTE: Landing Page
**Effort**: 1 jour | **Impact**: UX

```bash
Frontend:
[ ] Créer pages/Landing.tsx
  - Hero section (title + CTA)
  - Features grid (Accounts, Loans, Cards, Tontines)
  - Pricing cards (STARTER/PRO/ENTERPRISE - preview)
  - Testimonials/Stats (fake OK)
  - Footer
[ ] Add route /landing à App.tsx
[ ] Redirect non-auth users to /landing
[ ] Faire responsive + dark mode
```

**Files à créer**:
- `apps/client/src/pages/Landing.tsx`
- `apps/client/src/components/LandingHero.tsx`
- `apps/client/src/components/LandingFeatures.tsx`

---

### ⚠️ IMPORTANTE: Rate Limiting Global
**Effort**: 3 jours | **Impact**: Sécurité

```bash
Backend:
[ ] npm install @nestjs/throttler
[ ] Intégrer dans app.module
[ ] Configurer limits:
  - 100 req/min globales
  - 10 req/min par login attempt
  - 5 req/min par OTP
  - 1000 req/min per API key (futur)
[ ] Retourner 429 Too Many Requests
[ ] Tests (exceed limit = error)

Frontend:
[ ] Catch 429 → Show error message
[ ] Disable buttons during rate limit
```

**Packages**:
- `@nestjs/throttler`

---

### ✅ BONUS: PDF Exports
**Effort**: 1 jour | **Impact**: Fonctionnelle

```bash
Backend:
[ ] npm install pdfkit
[ ] Service: TransactionStatementService
  - Créer PDF avec transactions
  - Ajouter logo (si branding présent)
  - Inclure period, total, signatures
[ ] GET /transactions/statement/pdf?from=DATE&to=DATE
[ ] Retourner PDF buffer en stream

Frontend:
[ ] Button "Download Statement" sur Transactions page
[ ] Query: GET /transactions/statement/pdf?from=START&to=END
[ ] Trigger download (new Blob + URL.createObjectURL)
```

**Files à créer**:
- `apps/server/src/transactions/services/statement.service.ts`
- Add endpoint to `transactions.controller.ts`

---

## SPRINT 2 (Semaine 2-3, 10-15 jours)

### 🔴 BLOCKER 4: Multi-Tenancy (DATABASE)
**Effort**: 3-4 jours | **Impact**: CRITIQUE

```bash
Database:
[ ] Migration: Add tenant_id to ALL tables
[ ] Migration: Create tenant schema setup
[ ] Migration: Add RLS policies on every table
[ ] Test RLS with different users

Backend:
[ ] Middleware: Extract tenant from request
  - From subdomain (bank.platform.com)
  - From X-Tenant-ID header
  - From JWT custom claims
[ ] Repository base: Auto-add tenant_id filter to ALL queries
[ ] Test: Query isolation (user A ne voit pas user B)
[ ] Audit: Log tenant_id sur chaque action

Frontend:
[ ] Store tenant info in Zustand (on login)
[ ] Pass tenant header on all API calls
```

**Migrations needed**:
- Add tenant_id foreign key to: users, accounts, transactions, loans, cards, kyc_documents, tontines, etc.
- Create tenant table with schema name
- RLS policy per table

---

### 🔴 BLOCKER 5: Licensing System (Database)
**Effort**: 2-3 jours | **Impact**: CRITIQUE

```bash
Database:
[ ] Migration: Create licenses table
[ ] Migration: Create license_history table
[ ] Migration: Create usage_tracking table
[ ] Add indexes on tenant_id, expires_at

Backend:
[ ] LicenseService
  - validateFeature(tenantId, feature): boolean
  - checkRateLimit(tenantId): void
  - getLicenseStatus(tenantId): LicenseFeatures
  - createLicense(tenantId, tier, days)
  
[ ] FeatureGuard: Check license before endpoint
  
[ ] CronService
  - Daily: Expire old licenses
  - Daily: Alert licenses expiring soon
  - Hourly: Track usage metrics
  
[ ] Tests: License validation, rate limits

Admin Frontend:
[ ] Create page: /admin/licenses
  - List all licenses
  - Filters: status, tier, expiry
  - Actions: Extend, Downgrade, Suspend
  - Usage stats per license
```

**Files à créer**:
- `apps/server/migrations/0015_create_licenses_table.sql`
- `apps/server/src/licensing/licensing.service.ts`
- `apps/server/src/licensing/licensing.module.ts`
- `apps/server/src/licensing/guards/feature.guard.ts`
- `apps/server/src/licensing/cron/license-cleanup.cron.ts`
- `apps/admin/src/resources/licenses.tsx`

---

### 🔴 BLOCKER 6: Monitoring (Prometheus + Logs)
**Effort**: 2 jours | **Impact**: HAUTE

```bash
Backend:
[ ] npm install prom-client @nestjs/terminus
[ ] MetricsService: Track
  - Request count by endpoint
  - Response time (p50, p95, p99)
  - Error rate by type
  - Active users count
  - Transaction volume
  
[ ] GET /metrics → Prometheus format
[ ] GET /health → Health check endpoint
[ ] Add logging on all endpoints (info/error/warn)

Frontend:
[ ] Basic error tracking (try/catch → log endpoint)
[ ] Track page views (for analytics)
```

**Packages**:
- `prom-client`
- `@nestjs/terminus`
- `winston` (already have)

---

## SPRINT 3 (Semaine 4-5, 10-15 jours)

### 🟠 IMPORTANT: Payment Integration (Stripe)
**Effort**: 3 jours | **Impact**: REVENUE

```bash
Backend:
[ ] npm install stripe
[ ] StripeService
  - Initialize Stripe client
  - createCustomer(tenant)
  - createPaymentIntent(amount, description)
  - createSubscription(customerId, priceId)
  - handleWebhooks(event)

[ ] BillingService
  - linkStripeToTenant
  - createSubscription(tenantId, tier)
  - upgradeLicense(tenantId, newTier)
  - handlePaymentSuccess
  - handlePaymentFailed

[ ] Webhooks
  - POST /webhooks/stripe
  - Verify Stripe signature
  - Update local license on success

Admin Frontend:
[ ] Stripe Connect setup flow
[ ] Payment method management
[ ] Subscription history
```

**Files à créer**:
- `apps/server/src/billing/services/stripe.service.ts`
- `apps/server/src/billing/services/billing.service.ts`
- `apps/server/src/billing/controllers/billing.controller.ts`
- `apps/server/src/webhooks/webhooks.controller.ts` (+stripe)

---

### 🟠 IMPORTANT: Tontines - Distribution (Cron)
**Effort**: 2 jours | **Impact**: Fonctionnelle

```bash
Backend:
[ ] CronService: Check daily for distributions due
[ ] findTontinesReadyForDistribution()
  - Status = ACTIVE
  - Current cycle's beneficiary found
  - All payments received
  
[ ] distributeFunds(tontineId, beneficiaryId)
  - Calculate total received
  - Transfer to beneficiary account
  - Create tontine_distributions record
  - Mark cycle as complete
  - Notify all members
  - Advance to next cycle

[ ] Penalty cron: Detect missed payments
  - If payment due > 7 days overdue
  - Apply penalty (fixed € or %)
  - Notify user
  - Log to audit

Tests:
[ ] Distribution workflow complete
[ ] Penalty calculation correct
```

**Files à modifier**:
- `apps/server/src/tontines/crons/tontine-distribution.cron.ts`
- `apps/server/src/tontines/services/tontine-payout.service.ts`

---

## SPRINT 4 (Semaine 6+, Optional/Nice-to-Have)

### 🟡 OPTIONAL: White-Label (Custom Domains)
**Effort**: 2-3 jours

```bash
Backend:
[ ] TenantBrandingService
  - storeBranding(tenantId, branding)
  - getBranding(tenantId)
  
[ ] Domains
  - Map custom_domain → tenant_id
  - Middleware: Identify tenant from host header

Frontend:
[ ] Dynamic theme loading
  - GET /tenant/branding → Apply colors
  - Load logo dynamically
  - Set app name, titles, etc.
  
Admin:
[ ] Branding editor page
  - Upload logo
  - Color picker
  - Custom domain config
```

---

### 🟡 OPTIONAL: Advanced Fraud Detection
**Effort**: 3-5 jours

```bash
Backend:
[ ] Velocity checks
  - Max 5 transactions/hour
  - Max €10k/day per account
  - Alerts on breaches
  
[ ] Device fingerprinting
  - Track IP address
  - Track User-Agent
  - Alert on new device
  
[ ] Behavioral analysis
  - Track transaction patterns
  - Detect unusual amounts
  - Detect unusual times
```

---

## 📋 CHECKLIST COMPLÈTE

### Immediate (This Week)
```
[ ] Docker setup
[ ] Tontines payments
[ ] WebSocket notifications
[ ] Landing page
[ ] Global rate limiting
[ ] PDF exports
[ ] Run full test suite
[ ] Deploy to staging
```

### Short-term (2-3 weeks)
```
[ ] Multi-tenancy DB layer
[ ] Licensing system
[ ] Monitoring setup
[ ] Stripe integration
[ ] Tontines distribution cron
[ ] CI/CD pipeline (GitHub Actions)
```

### Medium-term (1-2 months)
```
[ ] White-label customization
[ ] Advanced fraud detection
[ ] WebAuthn implementation
[ ] SEPA transfers
[ ] Analytics dashboard
[ ] User impersonation (admin)
[ ] Advanced reporting
```

---

## 🚀 Quick Win Priorities

**Qu'attaque-t-on en premier pour un quick win ?**

### Order of Attack:
1. **Docker** (1 day) → Deployable anywhere
2. **Tontines Payments** (2 days) → Feature complete
3. **WebSocket** (2 days) → Real-time magic
4. **Landing Page** (1 day) → Professional look
5. **Rate Limiting** (3 days) → Security fixed
6. **PDF Exports** (1 day) → Users happy

**Total: ~10 days = MVP v2 "Production Ready"**

Then:
7. Multi-tenancy (3-4 days)
8. Licensing (2-3 days)
9. Monitoring (2 days)

**Total: ~20-25 days = Ready for SaaS multi-tenant**

