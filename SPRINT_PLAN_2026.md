# Sprints 2026 — Banque SaaS

Date: 2026-01-02
Scope: Plan d’implémentation aligné 2026 (multi-tenant, licensing, conformité, IA antifraude, temps réel, observabilité, déploiement cloud-native).

## Principes 2026
- Multi-tenant par défaut: isolation stricte (RLS, per-tenant quotas, métrologie) et data residency.
- IA antifraude et risk-based auth: détection en temps réel, step-up auth adaptative.
- Open Finance / PSD3: APIs publiques versionnées, consentements, throttling et monétisation.
- Cloud-native & fiabilité: OTel everywhere, SLO/SLAs, progressive delivery, autoscaling.
- Sécurité: mTLS interne, KMS/Vault, rotation clés, WAF/bot mitigation, zero trust.
- Performance & UX: Core Web Vitals, WCAG 2.2 AA, real-time UX (WebSocket/SSE), offline/PWA.

## Sprint 1 (Semaines 1-2) — Foundation & Ops Ready
- Docker + docker-compose (dev/prod), healthchecks, .dockerignore.
- Observabilité de base: OpenTelemetry traces + metrics, Prometheus + Grafana, logs structurés.
- Rate limiting global + WAF/bot rules (ingress/nginx/caddy) + throttling par tenant.
- WebSocket/SSE notifications avec garanties de livraison (acks/retry/backoff).
- PDF/CSV exports transactionnels + idempotence.
- Acceptance:
  - Build images reproductibles; `docker-compose up` OK.
  - Traces couvrent HTTP + DB; dashboards RED/USE.
  - 95% endpoints protégés par throttling; WAF règles OWASP top-10.
  - Notifications temps réel stables (tests automatisés).

## Sprint 2 (Semaines 3-4) — Multi-Tenancy & Licensing
- Ajout tenant_id end-to-end + migrations RLS; guards/interceptors multi-tenant.
- Licensing system + feature flags par plan; middleware d’autorisation; audit des refus.
- Usage metering par tenant (requests, events, stockage) + dashboards.
- Data residency/geo routing (EU/FR par défaut) et policies de stockage.
- Acceptance:
  - 100% requêtes critiques filtrées tenant_id + RLS enforced.
  - Refus de feature loggés avec motif/licence.
  - Dashboards d’usage par tenant; alertes dépassement quota.
  - Tests de non-fuite inter-tenant verts.

## Sprint 3 (Semaines 5-6) — Payments & Tontines Complètes
- Paiements tontines: endpoint pay, idempotence, réconciliation, reçus.
- Distribution/cron tontines (payouts, pénalités, relances), tamper-evident logs.
- Abstraction paiements (SEPA Instant/rails instant) + ISO 20022 payloads.
- Export statements programmés (PDF/CSV) + emailing.
- Acceptance:
  - Paiement et distribution bout-en-bout testés (simu + sandbox).
  - Cron idempotent, observé (metrics, traces) + alerting échecs.
  - Payloads conformes ISO 20022; reçus horodatés.

## Sprint 4 (Semaines 7-8) — Sécurité Renforcée & Compliance Runway
- Zero trust interne: mTLS service-to-service, authz fine-grained (OPA/ABAC).
- KMS/Vault pour secrets/keys; rotation automatique; envelope encryption des données sensibles.
- WAF/bot + device fingerprinting + velocity rules.
- DORA/NIS2/SOC2 runway: DR playbooks, RTO/RPO tests, change mgmt, journaux d’accès.
- Acceptance:
  - mTLS partout; certificats rotés; secrets hors code.
  - Tests de restauration réussis; rapports DR stockés.
  - Playbooks d’incident validés; alerting sur golden signals.

## Sprint 5 (Semaines 9-10) — IA Antifraude & Risk-Based Auth
- Moteur de règles temps réel + modèles ML légers (velocity, géo, device, montant).
- Step-up auth adaptative (2FA/TOTP/WebAuthn) selon score de risque.
- Surveillance AML/CTF continue + screening sanctions/PEP (batch + temps réel).
- Explainability & override manuel (console risk) + audit trail.
- Acceptance:
  - Scores calculés <150 ms P95; règles éditables sans redeploy.
  - Step-up déclenchée sur risques; logs d’audit complets.
  - Sanctions/PEP screening branché; faux positifs suivis.

## Sprint 6 (Semaines 11-12) — Open Finance & Monétisation
- API publique v1: versioning, quotas, portail dev, clés et rotations.
- Consentement utilisateur (OAuth2/OIDC + fine-grained scopes), journaux d’accès.
- Billing/monétisation d’API: métriques, facturation par appel/feature.
- Sandbox dev + jeux de données synthétiques.
- Acceptance:
  - Portail dev avec clés, quotas, docs; rotation clé testée.
  - Consent flows conformes PSD3; audit des accès.
  - Facturation API calculée et exportable; sandbox isolée.

## Sprint 7 (Semaines 13-14) — Fiabilité & Delivery
- Progressive delivery: blue/green ou canary + rollbacks automatiques.
- Chaos/DR drills réguliers; alert fatigue tuning; runbooks opérés.
- Autoscaling horizontal avec SLOs; budgets d’erreur appliqués.
- Backups chiffrés + PITR validé mensuellement.
- Acceptance:
  - Canaries avec seuils; rollback automatisé vérifié.
  - Chaos tests documentés; MTTR suivi.
  - SLO respecté sur 30 jours; backups restaurés en test.

## Sprint 8 (Semaines 15-16) — UX, Performance, Accessibilité
- WCAG 2.2 AA: audit contrastes, clavier, formulaires, focus.
- Core Web Vitals budgets + CI checks; optimisation mobile-first/PWA (offline caching).
- Real-time UX: toasts fiables, replays en cas de reconnexion, mode faible bande passante.
- Product analytics privacy-friendly (sans tracking invasif).
- Acceptance:
  - WCAG gaps fermés; audit passé.
  - CWV dans le vert; budgets respectés en CI.
  - PWA installable; mode offline basique opérationnel.

## Cadence & Gouvernance
- Chaque sprint: objectifs, critères d’acceptation, démo, rétrospective.
- Sécurité/compliance en “shift-left”: tests, lint, SAST/DAST, IaC scan dans CI.
- Evidence factory: logs d’audit, rapports DR, tests RLS, captures dashboards (SOC2/DORA).

## Mesures de succès globales
- P95 API < 300 ms sur core flows; 99.9% uptime cible.
- 0 fuite inter-tenant (tests automatiques + pentest).
- Alertes actionnables < 5% faux positifs critiques.
- RTO ≤ 1h, RPO ≤ 15 min; restores validées.
- Taux de paiement tontines réussi > 99.5%; reconciliations J+0.
- Core Web Vitals “Good” sur 95% des sessions mobiles.
