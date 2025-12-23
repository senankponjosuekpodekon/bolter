# 🔧 Quick Verification Commands

Run these to verify project status:

## ✅ Tests
```bash
# Run all tests
npm test

# Expected: 101 passing, 11 suites
# Location: apps/server src/**/*.spec.ts
```

## ✅ Build
```bash
# Build all workspaces
npm run build

# Build individual apps
npm run build:server
npm run build:client  
npm run build:admin
```

## ✅ Lint
```bash
# Lint everything
npm run lint

# Should be: 0 errors
```

## ✅ Dev Server
```bash
# Start everything
npm run dev

# Start individual
npm run dev:server  # Port 3000
npm run dev:client  # Port 5173
npm run dev:admin   # Port 5174
```

## 🔍 Quick Health Checks

### Frontend
```bash
# Check pages exist
ls apps/client/src/pages/*.tsx | wc -l
# Expected: 32 pages

# Check components
ls -la apps/client/src/components/
# Should show: modals, auth, forms, navigation, etc
```

### Backend  
```bash
# Check modules
ls apps/server/src/
# Expected: accounts, auth, cards, kyc, loans, tontines, etc

# Check migrations
ls apps/server/migrations/
# Expected: 0001 to 0014 (14 files)

# Check controllers
find apps/server/src -name "*.controller.ts" | wc -l
# Expected: 16 controllers
```

### Admin
```bash
# Check resources
ls apps/admin/src/resources/
# Expected: accounts, audits, kyc, loans, transactions, users
```

## 📊 Quick Metrics

### Lines of Code
```bash
# Frontend
find apps/client/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1

# Backend
find apps/server/src -name "*.ts" | xargs wc -l | tail -1

# Admin
find apps/admin/src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1
```

### Database
```bash
# Count migrations
ls apps/server/migrations/*.sql | wc -l
# Expected: 14+

# Check migrations content
grep -h "CREATE TABLE\|ALTER TABLE" apps/server/migrations/*.sql | wc -l
# Should show 20+ DDL statements
```

### API Endpoints
```bash
# Count endpoints
grep -r "@Post\|@Get\|@Put\|@Delete" apps/server/src --include="*.ts" | wc -l
# Expected: 80+
```

## 🚀 What's Missing (Quick Check)

### Docker
```bash
ls -la Dockerfile docker-compose.yml 2>/dev/null || echo "❌ MISSING: Docker files"
```

### Monitoring
```bash
grep -r "prometheus\|@nestjs/terminus" apps/server/src 2>/dev/null || echo "❌ MISSING: Monitoring"
```

### Multi-Tenancy
```bash
grep -r "tenant_id" apps/server/src --include="*.ts" | wc -l
# Low count (< 50) = Not properly implemented
```

### WebSocket
```bash
grep -r "@nestjs/websockets\|socket.io" apps/server/src 2>/dev/null || echo "❌ MISSING: WebSocket"
```

### Licensing
```bash
ls apps/server/src/licensing 2>/dev/null || echo "❌ MISSING: Licensing module"
```

## 📝 Test Coverage

```bash
# Run with coverage
npm run test:coverage

# Should see reports in:
# - coverage/ directory
# - apps/server/coverage/
# - apps/client/coverage/
```

## 🔐 Security Check

```bash
# Audit dependencies
npm audit

# Install vulnerabilities
npm audit fix

# Check for secrets in code
grep -r "process.env\|PASSWORD\|SECRET\|API_KEY" apps/*/src --include="*.ts" | head -20
```

## 🎯 Migration Status

```bash
# See all migrations
ls -1 apps/server/migrations/ | grep "^[0-9]"

# Expected sequence:
# 0001_add_user_locale_currency_timezone.sql
# 0002_add_two_factor_temp_secret.sql
# ...
# 0014_add_password_reset_tokens.sql
```

## 📦 Dependencies

```bash
# Check packages in each workspace
cat apps/server/package.json | grep -A 50 '"dependencies"'
cat apps/client/package.json | grep -A 50 '"dependencies"'
cat apps/admin/package.json | grep -A 50 '"dependencies"'

# Notable absences:
# - stripe (❌ MISSING)
# - socket.io (❌ MISSING)
# - prom-client (❌ MISSING)
# - @nestjs/websockets (❌ MISSING)
# - pdfkit (❌ MISSING)
```

## 🔄 Git Status

```bash
# See uncommitted changes
git status

# See recent commits
git log --oneline -20

# Count commits
git log --oneline | wc -l
```

## 🧪 Integration Tests

```bash
# Run full test suite with coverage
npm run test:coverage

# Output should show:
# Test Suites: 11 passed, 11 total
# Tests: 101 passed, 101 total
# Coverage: 80%+
```

## 🚨 Red Flags to Watch

```bash
# 1. Missing files
[ -f Dockerfile ] || echo "❌ DOCKER MISSING"
[ -d .github/workflows ] && [ -f .github/workflows/*.yml ] || echo "❌ CI/CD MISSING"
[ -f docker-compose.yml ] || echo "❌ DOCKER-COMPOSE MISSING"

# 2. Empty directories
[ -z "$(ls apps/server/src/licensing/)" ] && echo "❌ LICENSING EMPTY"
[ -z "$(find apps/server/src -name "*websocket*")" ] && echo "❌ WEBSOCKET MISSING"

# 3. Missing env file
[ -f .env ] || echo "⚠️ .env missing (use .env.example)"
```

## 📋 Verification Checklist

```
SHOULD PASS:
[ ] npm run lint → 0 errors
[ ] npm test → 101 passing
[ ] npm run build → Success
[ ] git status → Clean (or only audit files)

CRITICAL GAPS:
[ ] npm test → Tontines payment tests (MISSING)
[ ] Dockerfile → MISSING
[ ] docker-compose.yml → MISSING  
[ ] Multi-tenant tests → MISSING
[ ] Licensing tests → MISSING
[ ] WebSocket tests → MISSING

OPTIONAL BUT NICE:
[ ] Coverage > 80%
[ ] E2E tests
[ ] Performance benchmarks
[ ] Load tests
```

---

## 🎯 What to Run Right Now

### 1. Full Audit
```bash
npm run lint && npm test && npm run build
```

### 2. Check Status
```bash
echo "=== Frontend Pages ===" && ls apps/client/src/pages/*.tsx | wc -l
echo "=== Backend Modules ===" && ls -1 apps/server/src | grep -v "^\..*"
echo "=== Database Migrations ===" && ls apps/server/migrations/[0-9]*.sql | wc -l
echo "=== Test Status ===" && npm test 2>&1 | tail -5
```

### 3. Find Blockers
```bash
echo "❌ Missing Features:"
[ -f Dockerfile ] || echo "- Docker"
[ -d apps/server/src/licensing ] || echo "- Licensing"
[ -d apps/server/src/websocket ] || echo "- WebSocket"
grep -r "stripe" apps/server/src > /dev/null || echo "- Stripe"
```

---

**Last Updated**: December 23, 2025
**Status**: 65% Complete, Production Gaps Identified

