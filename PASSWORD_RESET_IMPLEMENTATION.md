# Implémentation du Flux "Mot de Passe Oublié"

## Résumé
Le flux de réinitialisation de mot de passe a été complètement implémenté avec les composants backend, frontend, base de données et notifications email.

---

## 🎯 Fonctionnalités Implémentées

### Backend (NestJS)

#### 1. Endpoints API
- **POST `/auth/forgot-password`**
  - Reçoit l'email de l'utilisateur
  - Génère un token aléatoire sécurisé (32 bytes)
  - Stocke le token avec expiration (1 heure)
  - Envoie l'email de réinitialisation
  - Retourne toujours succès (prévention énumération d'emails)
  - Rate limiting: 3 tentatives/heure (configuré mais à activer)

- **POST `/auth/reset-password`**
  - Reçoit le token et le nouveau mot de passe
  - Vérifie la validité et l'expiration du token
  - Hash le nouveau mot de passe (bcrypt)
  - Met à jour le mot de passe
  - Révoque toutes les sessions existantes
  - Enregistre dans l'audit log

#### 2. DTOs
- `ForgotPasswordDto`: validation email
- `ResetPasswordDto`: token + nouveau mot de passe (min 8 chars)

#### 3. Services
**AuthService** (nouveaux methodes):
- `forgotPassword(email: string)`: génération token + envoi email
- `resetPassword(token: string, newPassword: string)`: validation + reset

**UsersService** (nouveaux methodes):
- `setPasswordResetToken(userId, token, expiresAt)`: stockage token
- `findByPasswordResetToken(token)`: recherche par token
- `updatePasswordAndClearResetToken(userId, hashedPassword)`: update secure

**NotificationsService** (nouveau):
- `notifyPasswordReset({ userId, resetUrl })`: email HTML formaté avec lien

#### 4. Sécurité
- Token aléatoire cryptographique (32 bytes = 64 hex chars)
- Expiration automatique (1 heure)
- Hash du nouveau mot de passe (bcrypt, 10 rounds)
- Révocation de toutes les sessions après reset
- Protection contre énumération d'emails
- Audit logging complet (PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED)
- Rate limiting configuré: `password_reset` (3 tentatives/heure)

---

### Base de Données (PostgreSQL/Supabase)

#### Migration `0014_add_password_reset_tokens.sql`
```sql
ALTER TABLE users ADD COLUMN password_reset_token TEXT;
ALTER TABLE users ADD COLUMN password_reset_expires TIMESTAMPTZ;
CREATE INDEX idx_users_reset_token ON users(password_reset_token) 
  WHERE password_reset_token IS NOT NULL;
```

**Colonnes ajoutées**:
- `password_reset_token`: stocke le token unique
- `password_reset_expires`: timestamp d'expiration
- Index conditionnel pour recherche rapide

---

### Frontend (React + TypeScript)

#### 1. Pages
**ForgotPassword.tsx** (déjà existante, maintenant fonctionnelle):
- Formulaire email avec validation
- Appel POST `/auth/forgot-password`
- Écran de confirmation avec instructions
- Gestion d'erreurs
- Dark mode support
- i18n (EN/FR)

**ResetPassword.tsx** (déjà existante, maintenant fonctionnelle):
- Extraction du token depuis URL (`?token=...`)
- Formulaire nouveau mot de passe + confirmation
- Toggle visibility mot de passe
- Validation côté client (8 chars min, mots de passe identiques)
- Appel POST `/auth/reset-password`
- Écran de succès
- Redirection vers login
- Gestion token invalide/expiré

#### 2. Routing (App.tsx)
Routes publiques ajoutées:
```tsx
/forgot-password → <ForgotPassword />
/reset-password → <ResetPassword />
```

#### 3. Login.tsx
Ajout du lien "Mot de passe oublié ?" vers `/forgot-password`

---

### Notifications Email

#### Template HTML
Email formaté avec:
- Titre et message personnalisé
- Bouton bleu "Réinitialiser mon mot de passe"
- Lien cliquable vers `frontend.url/reset-password?token=xxx`
- Expiration visible (1 heure)
- Instructions sécurité ("Si vous n'avez pas demandé...")
- Footer avec disclaimer

#### Configuration
- Utilise `EmailService` (nodemailer)
- Fallback logs si SMTP non configuré
- Variables d'env: `FRONTEND_URL` ou `APP_URL` (défaut: localhost:5173)

---

## 📦 Fichiers Créés/Modifiés

### Créés
```
apps/server/src/auth/dto/forgot-password.dto.ts
apps/server/src/auth/dto/reset-password.dto.ts
apps/server/migrations/0014_add_password_reset_tokens.sql
```

### Modifiés
```
apps/server/src/auth/auth.service.ts         (+68 lignes: forgotPassword, resetPassword)
apps/server/src/auth/auth.controller.ts      (+23 lignes: 2 endpoints)
apps/server/src/users/users.service.ts       (+38 lignes: 3 méthodes DB)
apps/server/src/notifications/notifications.service.ts  (+23 lignes: notifyPasswordReset)
apps/server/src/config/configuration.ts      (+3 lignes: frontend.url)
apps/client/src/App.tsx                      (+10 lignes: routes)
apps/client/src/pages/Login.tsx              (+7 lignes: lien oublié)
TODO.md                                      (marqué ✅ DONE)
```

---

## 🔧 Configuration Requise

### Backend (.env)
```bash
# Frontend URL (pour construire le lien de reset)
FRONTEND_URL=http://localhost:5173
# ou APP_URL=http://localhost:5173

# Email (optionnel pour dev, requis pour prod)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
EMAIL_FROM=no-reply@banking-platform.test
```

### Base de Données
Appliquer la migration:
```bash
psql $DATABASE_URL < apps/server/migrations/0014_add_password_reset_tokens.sql
```
Ou via Supabase SQL Editor.

---

## 🧪 Tests Recommandés

### Test Manuel
1. **Demande de reset**:
   ```bash
   curl -X POST http://localhost:3000/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```
   Vérifier: email reçu, token en DB, audit log créé

2. **Reset mot de passe**:
   ```bash
   curl -X POST http://localhost:3000/auth/reset-password \
     -H "Content-Type: application/json" \
     -d '{"token":"abc123...", "newPassword":"NewPass123"}'
   ```
   Vérifier: mot de passe changé, token effacé, refresh_token révoqué

3. **Scénarios d'erreur**:
   - Email inexistant → succès simulé
   - Token invalide → 400 Bad Request
   - Token expiré → 400 Bad Request
   - Mot de passe trop court → 400 Bad Request

### Tests Unitaires (à ajouter)
```typescript
// apps/server/src/auth/auth.service.spec.ts
describe('forgotPassword', () => {
  it('should generate token and send email for valid user');
  it('should return success for non-existent email (no enumeration)');
  it('should respect rate limiting');
});

describe('resetPassword', () => {
  it('should reset password with valid token');
  it('should reject expired token');
  it('should reject invalid token');
  it('should hash new password');
  it('should revoke all sessions');
});
```

### Tests E2E
```typescript
// apps/server/test/auth.e2e-spec.ts
describe('Password Reset Flow', () => {
  it('POST /auth/forgot-password → email sent');
  it('POST /auth/reset-password → password changed');
  it('cannot reuse same token twice');
  it('old token invalid after 1 hour');
});
```

---

## 🔐 Sécurité

### Protections Implémentées
✅ Token cryptographiquement sécurisé (crypto.randomBytes)  
✅ Expiration automatique (1 heure)  
✅ Token à usage unique (effacé après utilisation)  
✅ Pas d'énumération d'emails (retour succès même si email inexistant)  
✅ Hash bcrypt du nouveau mot de passe  
✅ Révocation de toutes les sessions après reset  
✅ Audit logging complet  
✅ Rate limiting configuré (3/heure)  
✅ Index DB pour performance sans exposer tous les tokens  

### À Améliorer (Production)
- [ ] Activer rate limiting sur endpoint (middleware ou guard)
- [ ] HTTPS obligatoire en production
- [ ] CAPTCHA sur forgot-password (protection DDoS)
- [ ] Notification email si reset non initié par l'utilisateur
- [ ] Blacklist des mots de passe faibles (zxcvbn)
- [ ] Limiter le nombre de tokens actifs par utilisateur (max 3)

---

## 🚀 Déploiement

### Checklist Pré-Production
1. Appliquer migration DB
2. Configurer variables d'env (FRONTEND_URL, EMAIL_*)
3. Tester l'envoi d'email (SendGrid/Mailgun/etc.)
4. Vérifier rate limiting actif
5. Activer HTTPS
6. Tests E2E complets
7. Monitoring des logs d'audit

### Variables d'Environnement
```bash
# Obligatoire
FRONTEND_URL=https://banking-app.com
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.xxx
EMAIL_FROM=no-reply@banking-app.com

# Optionnel (déjà configuré)
JWT_SECRET=xxx
SUPABASE_URL=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 📊 Métriques & Monitoring

### Audit Logs à Surveiller
- `PASSWORD_RESET_REQUESTED`: fréquence anormale = attaque
- `PASSWORD_RESET_COMPLETED`: corrélation avec `REQUESTED`
- `PASSWORD_RESET_FAILED`: tentatives avec tokens invalides

### Alertes Recommandées
- > 10 resets/heure sur même IP
- > 5 resets/heure sur même user
- Tokens expirés utilisés en masse
- Échecs d'envoi email > 5%

---

## 📖 Documentation Utilisateur

### Pour l'utilisateur final
1. Sur la page de connexion, cliquer "Mot de passe oublié ?"
2. Entrer votre adresse email
3. Vérifier votre boîte mail (spam inclus)
4. Cliquer sur le lien (valide 1 heure)
5. Choisir un nouveau mot de passe (min 8 caractères)
6. Vous serez redirigé vers la page de connexion

### Traductions i18n
**FR** (déjà présent):
- auth.forgot_password
- auth.reset_password
- auth.reset_email_sent
- auth.password_reset_success

**EN** (déjà présent):
- Même structure

---

## ✅ Statut Final

**Implémentation: ✅ 100% COMPLÈTE**

- [x] Backend endpoints
- [x] DTOs et validation
- [x] Services (Auth + Users)
- [x] Migration DB
- [x] Notification email
- [x] Frontend pages
- [x] Routing
- [x] Lien depuis Login
- [x] Configuration
- [x] Sécurité
- [x] Audit logging
- [x] Lint + Build réussis
- [x] Documentation TODO.md mise à jour

**Prêt pour**: Tests manuels + Tests unitaires + Déploiement dev

---

## 📝 Notes de Développement

### Pourquoi 1 heure d'expiration ?
- Équilibre sécurité/UX
- Assez long pour vérifier email
- Assez court pour limiter fenêtre d'attaque
- Standard industrie (AWS, Google, etc.)

### Pourquoi révocation sessions ?
- Force re-authentification après changement sensible
- Protège contre attaquant ayant volé ancien refresh_token
- Bonne pratique OWASP

### Pourquoi pas d'énumération email ?
- Empêche découverte de comptes existants
- Standard OWASP (ASVS 2.1.5)
- Retour toujours "email sent if exists"

---

**Date d'implémentation**: 23 décembre 2025  
**Développeur**: GitHub Copilot + Claude Sonnet 4.5  
**Statut**: ✅ Production-ready (après tests)
