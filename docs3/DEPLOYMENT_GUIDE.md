# Sprint I: Production Deployment & Configuration Guide

**Date:** 6 décembre 2025  
**Version:** 1.0  
**Audience:** DevOps / Infrastructure Team

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Database Setup](#database-setup)
6. [Performance Monitoring](#performance-monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Pre-Deployment Checklist

### Code Quality

- [ ] All TypeScript compilation errors resolved
- [ ] ESLint/Prettier checks pass
- [ ] All unit tests passing (22+ tests)
- [ ] Manual testing completed in all 5 languages
- [ ] Code review approved

### Build Verification

- [ ] Client build successful (510.32 kB gzip: 159.17 kB)
- [ ] Server build successful (0 errors)
- [ ] No console errors or warnings in production build
- [ ] Bundle analysis reviewed
- [ ] Tree-shaking working (unused code removed)

### Documentation

- [ ] User guide prepared and tested
- [ ] API documentation updated
- [ ] Runbook created
- [ ] Support documentation ready
- [ ] Emergency contacts listed

### Infrastructure

- [ ] Database migrations prepared
- [ ] Redis/Cache configured
- [ ] CDN configured (if using)
- [ ] SSL/TLS certificates installed
- [ ] Monitoring and alerting configured

### Security

- [ ] Environment variables secured (no secrets in code)
- [ ] API authentication configured
- [ ] CORS policies set correctly
- [ ] Rate limiting configured
- [ ] HTTPS enforced

---

## Environment Configuration

### Backend Environment Variables

Create `.env` file in `/apps/server/`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bolter
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRATION=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRATION=7d

# Exchange Rate Service
EXCHANGE_RATE_API_KEY=your-api-key
EXCHANGE_RATE_API_URL=https://api.example.com/rates
EXCHANGE_CACHE_TTL=3600000           # 1 hour in milliseconds

# Supported Currencies
SUPPORTED_CURRENCIES=EUR,USD,CAD,AED,NGN,GHS,ZAR,XOF
DEFAULT_CURRENCY=EUR

# Localization
SUPPORTED_LOCALES=en-US,en-GB,fr-FR,fr-CA,ar-AE,pt-PT,sw-KE
DEFAULT_LOCALE=en-US

# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=info

# Email (for notifications)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@bolter.banking
SMTP_PASSWORD=your-password

# 2FA & Security
TOTP_WINDOW=2
OTP_EXPIRATION=300

# Redis (for caching)
REDIS_URL=redis://localhost:6379
REDIS_DB=0
```

### Frontend Environment Variables

Create `.env` file in `/apps/client/`:

```env
# API Configuration
VITE_API_BASE_URL=https://api.bolter.banking
VITE_API_TIMEOUT=30000

# i18n Configuration
VITE_DEFAULT_LOCALE=en-US
VITE_SUPPORTED_LOCALES=en-US,en-GB,fr-FR,fr-CA,ar-AE,pt-PT,sw-KE
VITE_LAZY_LOAD_I18N=true

# Feature Flags
VITE_ENABLE_2FA=true
VITE_ENABLE_KYC=true
VITE_ENABLE_LOANS=true

# Analytics (optional)
VITE_ANALYTICS_ID=your-analytics-id
VITE_SENTRY_DSN=your-sentry-dsn

# Build
VITE_BUILD_ANALYSIS=false
```

### Production Build Configuration

**vite.config.ts** considerations:

```typescript
export default defineConfig({
  build: {
    target: "esnext",
    minify: "terser",
    sourcemap: "hidden", // Don't expose source maps in production
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-i18next"],
          ui: ["lucide-react", "clsx"],
          api: ["axios", "@tanstack/react-query"],
        },
      },
    },
  },
});
```

---

## Backend Deployment

### Option 1: Docker Deployment

**Dockerfile:**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY apps/server/package*.json ./
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY apps/server/src ./src
COPY apps/server/tsconfig.json ./

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["node", "dist/main.js"]
```

**docker-compose.yml:**

```yaml
version: "3.8"

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: bolter
      POSTGRES_PASSWORD: secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build:
      context: .
      dockerfile: apps/server/Dockerfile
    environment:
      DATABASE_URL: postgresql://postgres:secure-password@db:5432/bolter
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--quiet",
          "--tries=1",
          "--spider",
          "http://localhost:3000/health",
        ]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Deploy:**

```bash
docker-compose up -d
docker-compose logs -f api
```

### Option 2: Direct Node Deployment

```bash
cd /app/bolter

# Install dependencies
npm ci --only=production

# Build backend
npm run build --workspace=server

# Run migrations
npm run migrate --workspace=server

# Start server (use PM2 for process management)
pm2 start dist/main.js --name "bolter-api"
pm2 save
```

### Database Migrations

```bash
# Run pending migrations
npm run migrate --workspace=server

# Rollback last migration
npm run migrate:rollback --workspace=server

# Create new migration
npm run migrate:create --workspace=server --name migration_name
```

---

## Frontend Deployment

### Build for Production

```bash
cd /app/bolter/apps/client

# Install dependencies
npm ci

# Build
npm run build

# Output: dist/ folder ready for CDN/server
```

### Deployment Options

#### Option 1: CDN (Recommended)

```bash
# Build
npm run build

# Upload to CDN
aws s3 sync dist/ s3://your-bucket/assets/ --delete

# Or with CloudFlare
wrangler publish

# Or with Netlify
netlify deploy --prod --dir dist/
```

#### Option 2: Static Server

```bash
# Serve from Nginx
server {
  listen 80;
  server_name app.bolter.banking;
  root /var/www/bolter/dist;

  # SPA routing
  try_files $uri $uri/ /index.html;

  # Cache busting for versioned files
  location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # HTML files (no cache)
  location ~* \.html$ {
    expires -1;
    add_header Cache-Control "public, no-cache, no-store, must-revalidate";
  }

  # API proxy
  location /api/ {
    proxy_pass http://localhost:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

#### Option 3: Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY apps/client/package*.json ./
RUN npm ci
COPY apps/client/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Build Optimization

```bash
# Analyze bundle
npm run build -- --analyze

# Monitor performance
npm run build:profile

# Check bundle size
npm run build
du -sh dist/
# Expected: ~664KB (uncompressed), ~159KB (gzipped)
```

---

## Database Setup

### PostgreSQL Initialization

```sql
-- Create database
CREATE DATABASE bolter;

-- Create user
CREATE USER bolter_user WITH PASSWORD 'secure-password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bolter TO bolter_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bolter_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bolter_user;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bolter_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bolter_user;
```

### Schema Setup

```bash
# Run migrations
npm run migrate:up --workspace=server

# Seed initial data (if applicable)
npm run seed --workspace=server
```

### Backup & Recovery

```bash
# Backup database
pg_dump -U bolter_user -h localhost bolter > bolter_backup.sql

# Restore database
psql -U bolter_user -h localhost bolter < bolter_backup.sql

# Automated backup (cron)
0 2 * * * pg_dump -U bolter_user bolter > /backups/bolter_$(date +\%Y\%m\%d).sql
```

---

## Performance Monitoring

### Key Metrics to Monitor

1. **API Response Times**
   - Target: < 500ms for 95th percentile
   - Monitor: Response time by endpoint

2. **Cache Hit Rate**
   - Exchange rates: > 80% cache hits
   - i18n namespaces: > 90% cache hits

3. **Database Connections**
   - Pool size: 20
   - Monitor: Active connections < 15

4. **Bundle Size**
   - Main JS: < 600KB (uncompressed)
   - Gzipped: < 200KB
   - Per-page: < 50KB lazy chunks

5. **Error Rate**
   - Target: < 0.1%
   - Monitor: 5xx, 4xx errors

### Monitoring Setup

**Prometheus metrics:**

```typescript
// Backend: src/metrics.ts
import prometheus from "prom-client";

const httpRequestDuration = new prometheus.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
});
```

**Logging:**

```bash
# Use structured logging
npm install winston pino

# Centralize logs to ELK/Splunk
```

**Alerting Rules:**

```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.001

- alert: CacheMissRate
  expr: rate(cache_misses_total[5m]) / rate(cache_requests_total[5m]) > 0.2

- alert: HighResponseTime
  expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5
```

---

## Troubleshooting

### Issue: Language Not Switching

**Symptoms:** User changes language in Profile, but UI remains in English

**Diagnosis:**

```bash
# Check browser
localStorage.getItem('i18nextLng')  # Should show selected language

# Check server logs
grep "localization" logs/server.log

# Check API response
curl -H "Accept-Language: fr-FR" http://localhost:3000/api/auth/me
```

**Solution:**

1. Clear browser cache and localStorage
2. Verify i18n is initialized: `i18n.language`
3. Check namespace is loaded: `i18n.hasResourceBundle(lang, namespace)`

### Issue: Currency Formatting Wrong

**Symptoms:** Amounts showing with wrong symbol position or separator

**Diagnosis:**

```javascript
// Test formatter
const formatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
});
console.log(formatter.format(1234.56)); // Should be "1 234,56 €"
```

**Solution:**

1. Verify locale is set correctly
2. Check Intl browser support: `console.log(Intl)`
3. Test in different browsers (IE doesn't support all locales)

### Issue: High API Latency

**Symptoms:** API responses > 1000ms

**Diagnosis:**

```bash
# Check database performance
EXPLAIN ANALYZE SELECT * FROM users WHERE locale = 'fr-FR';

# Check Redis cache
redis-cli INFO stats

# Check network
curl -w "@curl-format.txt" -o /dev/null -s https://api.bolter.banking/health
```

**Solution:**

1. Add database indexes: `CREATE INDEX idx_users_locale ON users(locale)`
2. Increase Redis memory: `maxmemory 512mb`
3. Enable CDN for static assets
4. Use query caching

### Issue: Bundle Size Growing

**Symptoms:** Build shows > 600KB uncompressed

**Diagnosis:**

```bash
npm run build:profile  # Analyze which modules are largest
```

**Solution:**

1. Lazy-load non-critical namespaces
2. Tree-shake unused code: `npm prune --production`
3. Split vendor chunks: Vite manual chunks
4. Upgrade dependencies: `npm update`

---

## Rollback Procedures

### Rollback via Docker

```bash
# List images
docker images | grep bolter

# Stop current container
docker-compose down

# Start previous version
docker pull bolter:v1.0.0
docker-compose up -d
```

### Rollback via Git

```bash
# View previous commits
git log --oneline

# Checkout previous commit
git checkout abc1234

# Rebuild and redeploy
npm run build --workspace=server
pm2 restart bolter-api
```

### Database Rollback

```bash
# List migrations
npm run migrate:list --workspace=server

# Rollback to specific migration
npm run migrate:to --workspace=server --target migration_name

# Or rollback one step
npm run migrate:rollback --workspace=server
```

### Frontend Rollback

```bash
# Revert CDN/S3
aws s3 sync s3://your-bucket-backup/v1.0.0 s3://your-bucket/ --delete

# Or clear CDN cache
cloudflare purge-cache

# Verify rollback
curl https://app.bolter.banking/
```

---

## Post-Deployment Validation

```bash
#!/bin/bash
set -e

echo "🔍 Validating deployment..."

# 1. Check API health
echo "Checking API health..."
curl -f https://api.bolter.banking/health || exit 1

# 2. Check frontend loads
echo "Checking frontend..."
curl -f https://app.bolter.banking/ > /dev/null || exit 1

# 3. Test database connection
echo "Checking database..."
psql -h localhost -U bolter_user -d bolter -c "SELECT 1" || exit 1

# 4. Test Redis cache
echo "Checking Redis..."
redis-cli ping || exit 1

# 5. Verify languages work
echo "Testing languages..."
for lang in en-US fr-FR ar-AE pt-PT sw-KE; do
  curl -s -H "Accept-Language: $lang" https://api.bolter.banking/api/localization/messages | grep -q '"' || exit 1
done

# 6. Verify currencies
echo "Testing currencies..."
curl -s https://api.bolter.banking/api/exchange/rates | grep -q "EUR" || exit 1

echo "✅ All validations passed!"
```

---

## Monitoring Dashboard Recommendations

### Key Dashboards

1. **System Health**
   - API uptime
   - Database connectivity
   - Cache hit rate
   - Error rate

2. **Performance**
   - Response times (95th percentile)
   - Request rate (RPS)
   - Bundle load time
   - i18n initialization time

3. **Business Metrics**
   - Language distribution (which languages used most)
   - Currency distribution (which currencies used most)
   - User registrations
   - Active users

4. **Alerts**
   - API down
   - Error rate > 1%
   - Response time > 1s
   - Cache miss rate > 20%

---

## Support Contacts

- **DevOps Lead:** [contact]
- **On-Call Engineer:** [rotating schedule]
- **Database Admin:** [contact]
- **Security Team:** [contact]

---

## Documentation Links

- [User Guide](./USER_GUIDE_MULTILANGUAGE.md)
- [Developer Guide](./DEVELOPER_GUIDE_I18N.md)
- [API Documentation](./API_REFERENCE.md)
- [Architecture Overview](./SPRINT_I_ARCHITECTURE_COMPLETE.md)

---

**Version:** 1.0  
**Last Updated:** 6 décembre 2025  
**Status:** Ready for Production
