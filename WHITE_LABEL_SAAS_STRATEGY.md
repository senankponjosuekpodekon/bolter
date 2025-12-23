# 🏢 Plan Stratégique : White-Label SaaS Bancaire Multi-Tenant

## Vue d'ensemble

Stratégie complète pour transformer la plateforme bancaire en SaaS multi-tenant avec licensing modulaire, permettant à plusieurs banques d'utiliser la plateforme en marque blanche avec des fonctionnalités spécifiques selon leur licence.

---

## 1. Architecture Multi-Tenancy Complète

### 1.1 Isolation des Données

```
Infrastructure:
├── Database
│   ├── Schema par tenant (schema_isolation)
│   │   └── Chaque banque = schéma PostgreSQL séparé
│   ├── Row-Level Security (RLS)
│   │   └── Données filtrées par tenant_id
│   └── Backup individuels par client
│
├── Storage (Supabase Buckets)
│   ├── /buckets/{tenant_id}/kyc-documents
│   ├── /buckets/{tenant_id}/profiles
│   └── /buckets/{tenant_id}/audit-logs
│
└── Secrets Management
    ├── API keys par tenant
    ├── Credentials chiffrés (Vault)
    └── Rotation automatique
```

### 1.2 Déploiement

**Option A** : Instance unique, multi-schema (plus économique)
- Une seule base de données PostgreSQL
- Schémas séparés par tenant
- Coûts partagés d'infrastructure
- Parfait pour STARTER/PROFESSIONAL

**Option B** : Instances séparées par tier (plus sécurisé)
- Infrastructure dédiée par tenant
- Meilleure isolation
- Ideal pour ENTERPRISE

**Option C** : Kubernetes avec namespaces par tenant
- Scalabilité maximale
- Résilience haute
- Multi-région possible

---

## 2. Système de Licensing Modulaire

### 2.1 Modèle de Licenses

| Tier | Prix | Users | Features | Transactions/mois |
|------|------|-------|----------|-------------------|
| **STARTER** | €500/mois | 50 | Accounts, KYC, Transactions basiques | 10,000 |
| **PROFESSIONAL** | €1,500/mois | 500 | STARTER + Loans, Cards, Analytics | 100,000 |
| **ENTERPRISE** | Custom | ∞ | PROFESSIONAL + Tontines, API, Support dédié | ∞ |

### 2.2 Feature Flags System

```typescript
// Backend: Feature flag service
interface LicenseFeatures {
  id: string;
  tenant_id: string;
  expiresAt: Date;
  modules: {
    accounts: boolean;
    kyc: boolean;
    transactions: boolean;
    loans: boolean;
    cards: boolean;
    tontines: boolean;
    whiteLabel: boolean;
    customBranding: boolean;
    apiAccess: boolean;
  };
  limits: {
    monthlyTransactions: number;
    maxUsers: number;
    storageGb: number;
    apiRateLimit: number;
  };
}

// Usage dans les controllers
@UseGuards(JwtVerifiedGuard, FeatureGuard('loans'))
@Post('/loans/create')
async createLoan(req: Request) {
  // Vérifie que le tenant a la licence 'loans'
}
```

### 2.3 License Validation

```typescript
// License Service
@Injectable()
export class LicenseService {
  async validateFeature(tenantId: string, feature: string): Promise<boolean> {
    const license = await this.getLicenseFromCache(tenantId);
    
    if (!license) throw new UnauthorizedException('License not found');
    if (license.expiresAt < new Date()) throw new UnauthorizedException('License expired');
    
    return license.modules[feature] === true;
  }
  
  async checkRateLimit(tenantId: string): Promise<void> {
    const usage = await redis.get(`usage:${tenantId}:${month}`);
    const limit = license.limits.monthlyTransactions;
    
    if (usage >= limit) {
      throw new PaymentRequiredException('Rate limit exceeded');
    }
  }
}
```

---

## 3. Customization & White-Label

### 3.1 Branding System

```typescript
interface TenantBranding {
  tenant_id: string;
  
  // Logo & Colors
  logo_url: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  
  // Textes personnalisés
  app_name: string;
  company_name: string;
  support_email: string;
  support_phone: string;
  
  // URLs
  website_url: string;
  privacy_policy_url: string;
  terms_url: string;
  
  // Emails
  logo_email: string;
  from_email: string;
  from_name: string;
  
  // Domains
  custom_domain: string; // bank.example.com
  subdomain: string;     // bank.platform.com
}
```

### 3.2 Configuration Tenant

```typescript
// Frontend: Chargement dynamique du branding
useEffect(() => {
  api.get('/tenant/branding').then(branding => {
    // Appliquer dynamiquement au DOM
    document.documentElement.style.setProperty('--primary', branding.primary_color);
    document.title = branding.app_name;
    setLogo(branding.logo_url);
  });
}, []);
```

### 3.3 Template Customization

```
Frontend Structure:
├── /components (universels)
├── /themes
│   ├── /default (standard)
│   └── /tenant-{id} (overrides personnalisés)
├── /locales (i18n)
│   ├── /fr (default)
│   └── /tenant-{id}/fr (custom)
└── /config
    └── branding.config.ts (dynamique depuis API)
```

---

## 4. Gestion des Licenses & Billing

### 4.1 Base de Données Licensing

```sql
-- Tenants
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  contact_email VARCHAR(255),
  status ENUM('ACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Licenses
CREATE TABLE licenses (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  tier VARCHAR(50), -- STARTER, PROFESSIONAL, ENTERPRISE
  starts_at TIMESTAMP,
  expires_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  modules JSONB, -- {"loans": true, "tontines": false, ...}
  limits JSONB,  -- {"monthlyTransactions": 10000, ...}
  status ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
  created_at TIMESTAMP
);

-- License History (audit)
CREATE TABLE license_history (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  action VARCHAR(100), -- CREATED, RENEWED, UPGRADED, DOWNGRADED, EXPIRED
  old_tier VARCHAR(50),
  new_tier VARCHAR(50),
  timestamp TIMESTAMP
);

-- Usage Tracking
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY,
  tenant_id UUID REFERENCES tenants(id),
  year_month VARCHAR(7), -- 2025-12
  feature VARCHAR(100),  -- loans, cards, tontines
  count INT,
  timestamp TIMESTAMP
);
```

### 4.2 Billing Integration avec Stripe

```typescript
@Injectable()
export class BillingService {
  constructor(
    private stripe: StripeService,
    private licenseService: LicenseService
  ) {}
  
  async createSubscription(
    tenantId: string,
    tier: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  ) {
    const priceId = this.getPriceId(tier);
    
    const subscription = await this.stripe.subscriptions.create({
      customer: tenant.stripe_customer_id,
      items: [{ price: priceId }],
      automatic_tax: { enabled: true },
    });
    
    // Générer la license
    await this.licenseService.createLicense(
      tenantId,
      tier,
      30 // days
    );
    
    return subscription;
  }
  
  async handleWebhook(event: Stripe.Event) {
    switch(event.type) {
      case 'invoice.payment_succeeded':
        // Renouveler license
        break;
      case 'invoice.payment_failed':
        // Suspendre access
        break;
      case 'customer.subscription_deleted':
        // Désactiver license
        break;
    }
  }
  
  async upgradeLicense(tenantId: string, newTier: string) {
    const oldLicense = await this.licenseService.getCurrentLicense(tenantId);
    
    // Proration avec Stripe
    const prorationData = this.stripe.calculateProration(
      oldLicense.tier,
      newTier,
      oldLicense.expiresAt
    );
    
    // Mettre à jour Stripe + local
    await Promise.all([
      this.stripe.updateSubscription(tenant.stripe_subscription_id, { items: [...] }),
      this.licenseService.createLicense(tenantId, newTier, prorationData.daysRemaining)
    ]);
  }
}
```

---

## 5. Modules Conditionnels (Feature Gating)

### 5.1 Routes Protégées par License

```typescript
// Decorator personnalisé
export const RequireFeature = (feature: string) => {
  return applyDecorators(
    UseGuards(JwtVerifiedGuard, FeatureGuard),
    SetMetadata('requiredFeature', feature)
  );
};

// Utilisation
@Controller('loans')
export class LoansController {
  
  @RequireFeature('loans')
  @Post('create')
  async createLoan(req: Request) {
    // Accessible uniquement si license.modules.loans === true
  }
}

@Controller('tontines')
export class TontinesController {
  
  @RequireFeature('tontines')
  @Post('create')
  async createTontine(req: Request) {
    // Accessible uniquement si license.modules.tontines === true
  }
}
```

### 5.2 Frontend : Navigation Dynamique

```typescript
// Hook pour vérifier features disponibles
function useAvailableFeatures() {
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    api.get('/tenant/license/features').then(setFeatures);
  }, []);
  
  return features;
}

// Navigation conditionnelle
function Navigation() {
  const features = useAvailableFeatures();
  
  return (
    <nav>
      <Link to="/accounts">Comptes</Link>
      {features.loans && <Link to="/loans">Prêts</Link>}
      {features.cards && <Link to="/cards">Cartes</Link>}
      {features.tontines && <Link to="/tontines">Tontines</Link>}
      {features.whiteLabel && <Link to="/admin/branding">Branding</Link>}
    </nav>
  );
}
```

---

## 6. Deployment Strategy

### 6.1 Environnements de Déploiement

```
┌─────────────────────────────────────────────┐
│     Shared Infrastructure (Multi-Tenant)    │
│  ├─ Database (PostgreSQL multi-schema)      │
│  ├─ Redis Cache (partagé, isolé par tenant) │
│  ├─ Supabase Storage (multi-bucket)         │
│  └─ API Gateway (routing par tenant)        │
│                                             │
│  Tiers:                                      │
│  ├─ STARTER/PROFESSIONAL → Shared           │
│  └─ ENTERPRISE → Dedicated (optionnel)      │
└─────────────────────────────────────────────┘
```

### 6.2 Reverse Proxy / API Gateway

```typescript
// Middleware: Identifier le tenant depuis la requête
app.use((req, res, next) => {
  const host = req.get('host');
  const tenantId = identifyTenantFromDomain(host);
  // ou depuis subdomain: bank.platform.com → bank
  // ou depuis header: X-Tenant-ID
  
  req.tenantId = tenantId;
  req.license = await licenseService.getLicense(tenantId);
  next();
});

// Toutes les requêtes filtrées par tenant
app.use(TenantFilterGuard);
```

---

## 7. Compliance & Security

### 7.1 Données Isolées & Sécurisées

```typescript
// Repository base class : auto-filtre par tenant
abstract class BaseRepository<T> {
  async find(filters: any) {
    return db.select()
      .from(this.table)
      .where({ tenant_id: req.tenantId, ...filters })
      .execute();
  }
}

// RLS Policy PostgreSQL (double sécurité)
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id'));
```

### 7.2 Audit & Compliance

```typescript
// Logs d'audit par tenant
interface AuditLog {
  id: UUID;
  tenant_id: UUID;
  user_id: UUID;
  action: string;
  resource: string;
  old_value: JSON;
  new_value: JSON;
  timestamp: TIMESTAMP;
  ip_address: string;
  user_agent: string;
}

// Conformité RGPD
- Droit à l'oubli (soft-delete tenant)
- Droit d'accès (export données tenant)
- Droit de portabilité (backup encrypted)
```

---

## 8. Monitoring & Operations

### 8.1 Métriques par Tenant

```typescript
@Injectable()
export class TenantMetricsService {
  async collectMetrics(tenantId: string) {
    return {
      activeUsers: await this.countActiveUsers(tenantId),
      transactions: await this.countTransactions(tenantId),
      apiUsage: await this.getApiUsage(tenantId),
      storageUsed: await this.getStorageUsage(tenantId),
      licenseStatus: await this.getLicenseStatus(tenantId),
      uptime: await this.calculateUptime(tenantId),
    };
  }
}

// Dashboard Admin: Vue sur tous les tenants
- Revenus totaux par tier
- Taux de renouvellement
- Feature adoption par module
- Alertes: License expirant, Usage approchant limite
```

### 8.2 Cron Jobs de Gestion

```typescript
// 1. Alertes license expirant (7j avant)
@Cron('0 8 * * *') // Chaque jour 8h
async alertExpiredLicenses() {
  const soon = await db.query(`
    SELECT * FROM licenses
    WHERE expires_at < NOW() + INTERVAL '7 days'
    AND expires_at > NOW()
    AND status = 'ACTIVE'
  `);
  
  // Envoyer email au contact_email du tenant
}

// 2. Suspendre licenses expirées
@Cron('0 0 * * *') // Minuit
async suspendExpiredLicenses() {
  await db.update('licenses')
    .set({ status: 'EXPIRED', auto_renew: false })
    .where('expires_at < NOW() AND status = ACTIVE');
}

// 3. Renouvellement automatique (si auto_renew)
@Cron('0 1 * * *') // 1h du matin
async autoRenewLicenses() {
  const toRenew = await db.query(`
    SELECT * FROM licenses
    WHERE auto_renew = true
    AND expires_at < NOW() + INTERVAL '3 days'
  `);
  
  for (const license of toRenew) {
    await this.billingService.renewLicense(license.tenant_id);
  }
}
```

---

## 9. Modèle Commercial & Pricing

### 9.1 Stratégie Tarifaire

| Tier | STARTER | PROFESSIONAL | ENTERPRISE |
|------|---------|--------------|-----------|
| **Prix/Mois** | €500 | €1,500 | Devis |
| **Utilisateurs** | 50 | 500 | ∞ |
| **Transactions/mois** | 10,000 | 100,000 | ∞ |
| **API Calls/sec** | 10 | 50 | 200 |
| **Stockage (GB)** | 10 | 100 | 1,000 |
| **Support** | Email | Email+Chat | Dédié |
| **SLA** | 48h | 24h | 4h |
| **Uptime Garantie** | 99% | 99.5% | 99.9% |

### 9.2 Modules par Tier

| Feature | STARTER | PROFESSIONAL | ENTERPRISE |
|---------|---------|--------------|-----------|
| Accounts | ✅ | ✅ | ✅ |
| KYC | ✅ | ✅ | ✅ |
| Transactions | ✅ | ✅ | ✅ |
| Loans | ❌ | ✅ | ✅ |
| Cards | ❌ | ✅ | ✅ |
| Tontines | ❌ | ❌ | ✅ |
| White-label | ❌ | Limited | ✅ |
| API Access | ❌ | ✅ | ✅ |

### 9.3 Modèle Freemium

```
├─ 14-day TRIAL (toutes features)
└─ Après: STARTER gratuit limité (1 user, 100 transactions/mois)
```

---

## 10. Stack Technique Recommandé

### 10.1 Frontend (Customizable)

```
├─ React 18 + TypeScript
├─ Dynamic Theming (CSS variables)
├─ i18n (multi-langue)
├─ Feature flags client
└─ Custom domain support (CNAME)
```

### 10.2 Backend (Multi-tenant)

```
├─ NestJS (modules conditionnels)
├─ PostgreSQL (multi-schema)
├─ Supabase (multi-bucket)
├─ Redis (cache + rate limiting)
├─ Stripe (billing)
└─ Kafka (async events)
```

### 10.3 Deployment

```
├─ Docker (images par tenant optionnel)
├─ Kubernetes (namespaces)
├─ CloudFlare (WAF + DDoS)
├─ GitHub Actions (CI/CD)
└─ Terraform (IaC)
```

### 10.4 Monitoring

```
├─ DataDog / Prometheus
├─ Sentry (error tracking)
├─ ELK Stack (logs)
└─ Grafana (dashboards)
```

---

## 11. Roadmap Implementation 📅

### Phase 1 (4-6 semaines)
- ✅ Système de licensing simple (STARTER/PRO/ENTERPRISE)
- ✅ Multi-tenancy de base (schema isolation)
- ✅ Feature flags backend
- ✅ Intégration Stripe

### Phase 2 (6-8 semaines)
- ✅ White-label branding complet
- ✅ Custom domains
- ✅ Tenant dashboard (admins)
- ✅ API keys per tenant

### Phase 3 (4-6 semaines)
- ✅ Advanced customization (templates)
- ✅ Webhook management
- ✅ Advanced analytics
- ✅ Dedicated instances option

### Phase 4 (Ongoing)
- ✅ Performance optimization
- ✅ Marketplace (plugins/extensions)
- ✅ Advanced compliance tools

---

## 12. Recommandations Clés

### Pour la Vente

Les banques paieront pour:
1. **License** (mensuel/annuel) - Modèle récurrent stable
2. **Overage** (transactions supplémentaires) - Revenus variables
3. **Support** (SLA premium) - Service à valeur ajoutée
4. **Custom features** (development) - Services professionnels

### Avantages du Modèle

✅ **Pour vous**: Revenus récurrents, scalabilité, économies d'échelle
✅ **Pour les banques**: Coûts réduits, time-to-market rapide, flexibilité
✅ **Sécurité**: Multi-tenancy isolée, RLS, audit complet
✅ **Flexibilité**: Chaque banque personnalise pour ses clients

### Risques à Gérer

⚠️ Data isolation stricte (RLS + schémas)
⚠️ Noisy neighbor problem (rate limits par tenant)
⚠️ Conformité régionale (RGPD, bancaire)
⚠️ Performance à l'échelle (caching, optimisations)

---

## Conclusion

Ce modèle SaaS en marque blanche transforme votre plateforme bancaire en un **moteur monétaire multi-locataires** tout en maintenant isolation, sécurité et conformité. Chaque banque reçoit une solution bancaire clé en main, personnalisée selon ses besoins.

**Impact Commercial**: De €0 à €100k+/mois avec seulement quelques clients ENTERPRISE.

