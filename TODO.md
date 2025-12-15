- [ ] Add automated tests covering the new account creation endpoint and UI flow.

## Sécurité & Authentification (Nouvelles actions)

- [x] Photo de profil : upload + preview côté client, endpoint `/users/profile/avatar`, stockage et redimensionnement (Sharp), limites 2MB et filtres JPG/PNG/WebP. ✅ DONE (avatar.service, avatar.controller, ProfileAvatar.tsx)
- [ ] Empreinte digitale (WebAuthn) : options d'enregistrement + vérification (`@simplewebauthn/server`), front `startRegistration`, stockage du credential publicKey/credentialID, UI dans le profil.
- [x] OTP / 2FA : activer/désactiver, vérification côté client (UI `TwoFactorSettings.tsx`, `Verify2FAModal.tsx`) et endpoints `/auth/2fa/*`.
- [ ] Codes de secours (10 codes, hashés en base), régénération et affichage unique, tests de vérification.
- [ ] Transactions : protéger les endpoints avec `JwtVerifiedGuard`, exiger OTP supplémentaire au-delà d'un seuil (ex: > 1000), vérification ownership compte, journal d'audit.
- [ ] Notifications sécurité : push temps réel (WebSocket) pour transactions/création de session, logs d'audit consultables.
- [ ] Limites & anomalies : rate limit renforcé sur OTP, seuils journaliers/hebdomadaires de transaction, alerte sur device/IP inconnus.

## Gestion des Fichiers (File Storage Management)

### Infrastructure Supabase & Base de Données

- [x] Vérifier/configurer bucket Supabase `kyc-documents` (5MB, private, JPG/PNG/PDF) — migration présente (`apps/server/migrations/0003_create_kyc_storage_bucket.sql`).
- [ ] Créer bucket `profile-avatars` (2MB, private, JPG/PNG/WebP)
- [ ] Ajouter table `file_audit_logs` : user_id, file_path, action (upload/delete/access), timestamp, status
- [x] Vérifier RLS policies sur `kyc-documents` (lecture/upload utilisateur, lecture/suppression admin) — documenté et utilisé via signed URLs.
- [ ] Ajouter RLS policies sur profile_avatars (privée, accès utilisateur/admin)
- [ ] Ajouter RLS policies sur file_audit_logs (utilisateur lit ses logs, admin lit tous)
- [x] Tester connexion Supabase SDK depuis backend (auth, storage, database) — utilisé dans `apps/server/src/kyc/kyc-storage.service.ts`.

### Backend : Service & Endpoints (KYC existant + Photo)

- [ ] Améliorer KycService : validation fichier avant upload (type MIME, taille, checksum)
- [x] Ajouter FileStorageService : méthodes upload/download/delete/audit — implémenté (`apps/server/src/kyc/kyc-storage.service.ts`).
- [x] Endpoints KYC fichiers — `POST /kyc/documents/upload`, `GET /kyc/documents/:id/view` (signed URL), `GET /kyc/documents/:id/download`.
- [x] Audit logs export côté admin — `admin/audit-export.*` (CSV/JSON/PDF/stats/logs).
- [ ] Endpoint `POST /profile/avatar` : upload photo profil (image validation + Sharp resize)
- [ ] Endpoint `GET /profile/avatar/:userId` : récupération photo (public ou private selon config)
- [ ] Endpoint `DELETE /profile/avatar` : suppression avatar utilisateur
- [ ] Ajouter `JwtVerifiedGuard` sur tous endpoints fichiers
- [ ] Implémenter retry logic (3 tentatives) pour uploads Supabase
- [ ] Gestion erreurs : timeout, réseau, validation, quota dépassé

### Backend : Sécurité & Audit

- [ ] Vérifier RLS policies appliquées (test par query directe PostgreSQL)
- [ ] Implémenter checksum validation (SHA256) pour intégrité fichier
- [x] Ajouter signed URLs (Supabase, expiration 1h) pour visualisation sécurisée des documents KYC.
- [x] Audit logging : système d'audit présent (`apps/server/src/audit-logs/*`, `admin/audit-export.*`).
- [ ] Implémenter rate limiting : 10 uploads/heure par utilisateur
- [x] Vérifier RGPD compliance : droit d'accès (GET audit logs), droit d'oubli (soft delete + purge après 90j). ✅ DONE (soft-delete + cascading cleanup + 90-day retention + daily cron purge)
- [ ] Tests sécurité : RLS bypass, accès cross-user, token expiré

### Frontend : Upload KYC (React)

- [ ] Composant KycUpload : drag-and-drop, preview, validation côté client
- [ ] Validation fichier : extension (JPG/PNG/PDF), taille (< 5MB), MIME type
- [ ] Progress bar : afficher % upload
- [ ] Gestion erreurs : messages utilisateur clairs (fichier trop gros, type invalide, etc.)
- [ ] Retry automatique : 3 tentatives en cas d'erreur réseau
- [ ] État upload : pending → uploading → success/error
- [x] Afficher statut KYC dans `Profile.tsx` et Dashboard (alertes et navigation vers `#profile-kyc`).
- [ ] Bouton delete : suppression logique avec confirmation
- [ ] Responsive design (mobile-first) + dark mode

### Frontend : Upload Avatar (React)

- [ ] Composant ProfileAvatar : upload photo, preview, crop (rect-area)
- [ ] Validation image : JPG/PNG/WebP, < 2MB, dimension min 200x200px
- [ ] Resize serveur : générer thumbnail 100x100px, avatar 300x300px
- [ ] Preview avant upload
- [ ] Spinner/loading state
- [ ] Gestion erreurs
- [ ] Affichage avatar dans profil + navbar
- [ ] Support gravatar fallback (MD5 email hash)
- [ ] Responsive design + dark mode

### Frontend : Audit Trail UI

- [ ] Page `/audit/files` : tableau historique accès fichiers
- [ ] Colonnes : date, action (upload/delete/access), fichier, utilisateur (admin view), statut, détails
- [ ] Filtres : par action, par date range, par utilisateur (admin)
- [x] Export CSV/JSON/PDF : audit trail côté admin (AuditExportPanel + endpoints).
- [ ] Responsive design + dark mode

### Frontend : Intégration globale

- [ ] Navigation : lien vers "Mes documents" (KYC) + "Photo profil" (Paramètres)
- [ ] Modal confirmation : avant supprimer fichier
- [ ] Toast notifications : upload réussi, erreur upload, fichier supprimé
- [ ] Support i18n (EN/FR) : labels, messages d'erreur, confirmations
- [ ] Dark mode : images backgrounds transparent/clairs

### Tests & Validation

- [ ] Tests unitaires : FileStorageService (upload/download/delete/audit)
- [ ] Tests KycService : validation fichier, RLS
- [ ] Tests E2E : upload KYC → verification admin → approve → download
- [ ] Tests E2E : upload avatar → resize → affichage profil
- [ ] Tests sécurité : RLS bypass, accès non-autorisé, token expiré, rate limit
- [ ] Tests performance : upload 5MB, multiple uploads simultanés
- [ ] Coverage > 80%

### Documentation

- [x] Documentation complète ajoutée (`FILE_STORAGE_*.md`, `START_HERE_FILE_STORAGE.md`).
- [ ] Ajouter guide sécurité : RLS policies, signed URLs, audit logging
- [ ] API documentation : endpoints fichiers (Swagger/OpenAPI)
- [ ] Troubleshooting : 404 sur download, upload timeout, quota dépassé

### Photo de Profil (Phase 2 - Optionnel)

- [ ] Implémenter Sharp pour redimensionnement (thumbnail + avatar sizes)
- [ ] Ajouter webhook Supabase pour post-processing images
- [ ] Implémenter CDN caching (cloudflare) pour avatars
- [ ] Avatar collection publique (gravatar-like)

### Monitoring & Maintenance

- [ ] Ajouter metrics : uploads/jour, total stockage utilisé, erreurs
- [ ] Alerte : quota bucket presque atteint (> 80%), uploads échoués
- [ ] Cron job : archiver audit logs > 6 mois
- [x] Cron job : supprimer fichiers "soft deleted" > 90 jours (RGPD) ✅ DONE (CleanupTaskService with daily 2 AM cron)
- [ ] Dashboard monitoring : stockage par user, uploads trends
- [ ] Backup Supabase : daily snapshots PostgreSQL + bucket exports

## Tontine (ROSCA) - Nouvelle fonctionnalité

### Menu Finance : refonte avec 2 onglets

- [ ] Remplacer menu "Prêt" par "Finance" avec 2 sous-onglets : "Tontine" et "Prêt"
- [ ] Navigation tabs fluide (React Router ou state local)
- [ ] Icons lucide-react : Coins (Tontine), Banknote (Prêt)

### Backend : Modèles & API

- [ ] Créer entité `Tontine` : owner, type (personnel/communautaire), montant, périodicité (hebdo/bi-hebdo/mensuelle), durée/cycles, objectif, statut, règles pénalité
- [ ] Créer entité `TontineMember` : rôle (owner/membre), KYC status, 2FA status, ordre collecte, date adhésion
- [ ] Créer entité `TontineSchedule` : due_date, amount, member_id bénéficiaire, statut paiement
- [ ] Créer entité `TontinePayment` : tontine_id, membre, montant, date, moyen paiement, statut, proof
- [ ] Créer entité `TontinePenalty` : type, montant, motif (retard, absence), état appliqué
- [ ] Créer entité `TontineDistribution` : tontine_id, date, bénéficiaire, montant, reçu
- [ ] Endpoint `POST /tontine/create` : validation inputs (montant, périodicité, durée, objectif), génération calendrier automatique
- [ ] Endpoint `POST /tontine/:id/join` : invitation lien + code, vérif KYC/2FA, ajout à order collecte
- [ ] Endpoint `POST /tontine/:id/pay` : requiert `JwtVerifiedGuard` (2FA), paiement montant cycle, cantonner fonds ledger interne
- [ ] Endpoint `POST /tontine/:id/distribute` : distribution auto au bénéficiaire du tour, notification, reçu
- [ ] Endpoint `GET /tontine` : list tontines (actives + archivées)
- [ ] Endpoint `GET /tontine/:id` : détails complets + schedule + members + historique paiements
- [ ] Endpoint `GET /tontine/:id/schedule` : calendrier des prochaines échéances et tours
- [ ] Endpoint `POST /tontine/:id/invite` : générer lien/code invitation, envoyer notification

### Backend : Sécurité & Pénalités

- [ ] Ajouter `JwtVerifiedGuard` sur endpoints paiement/distribution (force 2FA)
- [ ] Vérifier KYC requis avant create/join tontine
- [ ] Cron job : détecter paiements en retard, appliquer pénalité (frais fixe ou %)
- [ ] Logs d'audit : chaque paiement, distribution, pénalité, membre ajouté
- [ ] Notifications temps réel (WebSocket) : paiement reçu, tour attribué, retard détecté, pénalité appliquée
- [ ] Ledger interne : compte fiducie pour cantonner fonds tontine jusqu'à distribution

### Frontend : Page Tontine (React)

- [ ] Créer page `/finance/tontine` (tab structure avec Prêt)
- [ ] **Section Récapitulatif** : carte header avec objectif, montant/cycle, périodicité, date fin, statut, badge 2FA requis
- [ ] **Barre de progression** : cycles effectués / total, pourcentage visuel
- [ ] **Section "À payer"** : afficher cycle courant (montant, date), bouton primaire "Payer maintenant" (lien vers paiement)
- [ ] **Timeline prochaines échéances** : 3 prochains paiements avec dates + montants
- [ ] **Calendrier des tours** (si communautaire) : ordre des bénéficiaires, dates de distribution, badge "c'est votre tour !"
- [ ] **Historique paiements** : tableau récapitulatif (date, montant, statut, moyen paiement), filtres/tri
- [ ] **Alertes visuelles** : pénalité appliquée (couleur rouge), retard (orange), 2FA manquant (jaune)
- [ ] **Bouton "Inviter"** (communautaire) : modal copier lien/code, partage WhatsApp/SMS/Mail
- [ ] **Section "Règles"** : affichage pénalités, tolérance retard, modalités remplacement membre
- [ ] Responsive design (mobile-first) + dark mode support

### Frontend : Création Tontine (Modal/Wizard)

- [ ] Formulaire multi-étapes (wizard) :
  - Étape 1 : type (personnel ou communautaire), objectif, montant/cycle
  - Étape 2 : périodicité (hebdo/bi-hebdo/mensuelle), durée (nombre de cycles)
  - Étape 3 : règles (pénalités, tolérance retard, mode ordre bénéficiaires)
  - Étape 4 : résumé + validation
- [ ] Validation inputs côté client (montant > 0, durée > 0, etc.)
- [ ] Génération calendrier instantanée (afficher preview)
- [ ] Requête POST `/tontine/create` sur submit

### Frontend : Rejoindre Tontine (Modal)

- [ ] Input : lien/code invitation
- [ ] Vérif KYC/2FA (afficher status)
- [ ] Afficher détails tontine (récap, autres membres, ordre)
- [ ] Bouton "Rejoindre" → POST `/tontine/:id/join`
- [ ] Notification : "Bienvenue dans la tontine X"

### Frontend : Paiement Tontine

- [ ] Modal/page dédiée : montant dû, date, moyens paiement disponibles
- [ ] Intégration API paiement (carte, wallet, compte interne)
- [ ] Vérification 2FA avant confirmation
- [ ] Reçu numérique après succès
- [ ] Notification en temps réel : "Paiement reçu"

### Frontend : Notifications & UX

- [ ] Toast notifications : paiement effectué, retard détecté, pénalité appliquée, tour attribué
- [ ] Badges/statuts visuels : "Actif", "En retard", "Complète", "Archivée"
- [ ] Icônes lucide-react : Coins, Clock, AlertCircle, CheckCircle2, XCircle, Users, Share2
- [ ] Support i18n (EN/FR) pour étiquettes, messages, erreurs

### Tests & Validation

- [ ] Tests unitaires : TontineService (create, join, pay, distribute, penalty calc)
- [ ] Tests E2E : scénario complet (création → invitation → paiements → distribution → clôture)
- [ ] Validation sécurité : KYC requis, 2FA requis, vérif ownership membre
- [ ] Performance : requêtes optimisées (select champs nécessaires), cache calendrier

---

## Sprint I: Multi-Devise & Multi-Langue (En Cours)

### Phase 1: Backend ✅ COMPLÉTÉE

- [x] ExchangeService enhancement (9 devises, cache, taux croisés)
- [x] LocalizationService (messages EN + FR)
- [x] 3 Formatters (currency, date, number)
- [x] 5 API endpoints
- [x] Unit tests (22 tests)
- [x] Compilation sans erreurs

**Documents:**

- SPRINT_I_PLANNING.md (vue d'ensemble)
- SPRINT_I_PHASE1_COMPLETION.md (résumé Phase 1)
- SPRINT_I_PHASE1_IMPLEMENTATION.md (guide détaillé)
- SPRINT_I_STATUS.md (rapport global)
- SPRINT_I_TESTING.md (guide testing)

### Phase 2: Frontend Infrastructure ⏳ À VENIR

- [ ] Améliorer i18n configuration (namespaces)
- [ ] Traductions EN (5 fichiers)
- [ ] Traductions FR (5 fichiers)
- [ ] Frontend formatters (4)
- [ ] Custom hooks (4)

**Document:** SPRINT_I_PHASE2_GUIDE.md

### Phase 3: Composants & UI ⏳ À VENIR

- [ ] Composants localization
- [ ] Register/Profile updates
- [ ] Transactions page
- [ ] KYC + Admin pages

### Phase 4: Tests & Documentation ⏳ À VENIR

- [ ] Tests E2E
- [ ] Documentation finale

4 problems vscode, remboursements, tests clients

Admin doit pouvoir délivré un borderau de virement, régistre interne pour tracer les mouvements
Systeme de compensation simulé si plusieurs banque existe dans votre plateforme, Preuve de transaction pour la transparence
