## Matrice des permissions par rôle

### Authentification & Accès

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Login `/api/auth/login` | ✅ | ✅ | ✅ | ✅ |
| Refresh token | ✅ | ✅ | ✅ | ✅ |
| Reset password | ✅ | ✅ | ✅ | ✅ |
| Activer 2FA | ✅ | ✅ | ✅ | ✅ |
| Accès `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| Accès `/admin/*` | ❌ | ✅ | ✅ | ✅ |
| Accès `/admin/system-config` | ❌ | ❌ | ❌ | ✅ |

---

### Comptes

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Voir ses propres comptes | ✅ | ✅ | ✅ | ✅ |
| Créer un compte (limité) | ✅ | ✅ | ✅ | ✅ |
| Créer un compte pour un autre user | ❌ | ❌ | ✅ | ✅ |
| Modifier un compte (ex: IBAN) | ❌ | ❌ | ✅ | ✅ |
| Voir tous les comptes | ❌ | ❌ | ✅ | ✅ |
| Exporter relevé PDF | ✅ | ✅ | ✅ | ✅ |

---

### Transactions

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Faire un dépôt / retrait | ✅ | ✅ | ✅ | ✅ |
| Voir ses transactions | ✅ | ✅ | ✅ | ✅ |
| Voir toutes les transactions | ❌ | ✅ | ✅ | ✅ |
| Voir transactions en attente | ❌ | ✅ | ✅ | ✅ |
| Valider / rejeter une transaction | ❌ | ✅ | ✅ | ✅ |
| Créer une transaction pour un client | ❌ | ✅ | ✅ | ✅ |
| Filtres avancés | ❌ | ✅ | ✅ | ✅ |

---

### KYC

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Soumettre ses documents KYC | ✅ | ✅ | ✅ | ✅ |
| Voir ses statuts KYC | ✅ | ✅ | ✅ | ✅ |
| Voir tous les documents KYC en attente | ❌ | ✅ | ✅ | ✅ |
| Approuver / rejeter un KYC | ❌ | ✅ | ✅ | ✅ |
| Télécharger documents KYC | ❌ | ✅ | ✅ | ✅ |

---

### Prêts

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Simuler un prêt | ✅ | ✅ | ✅ | ✅ |
| Soumettre une demande de prêt | ✅ (KYC requis) | ✅ | ✅ | ✅ |
| Voir ses prêts | ✅ | ✅ | ✅ | ✅ |
| Voir tous les prêts | ❌ | ✅ | ✅ | ✅ |
| Approuver / rejeter un prêt | ❌ | ✅ | ✅ | ✅ |

---

### Utilisateurs

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Voir son profil | ✅ | ✅ | ✅ | ✅ |
| Modifier son profil (nom, locale…) | ✅ | ✅ | ✅ | ✅ |
| Changer son propre rôle | ❌ | ❌ | ❌ | ❌ |
| Voir tous les utilisateurs | ❌ | ❌ | ✅ | ✅ |
| Créer un utilisateur | ❌ | ❌ | ✅ | ✅ |
| Modifier un CLIENT | ❌ | ❌ | ✅ | ✅ |
| Modifier un ADMIN | ❌ | ❌ | ❌ | ✅ |
| Changer le rôle d'un user | ❌ | ❌ | ❌ | ✅ |
| Supprimer un CLIENT | ❌ | ❌ | ✅ | ✅ |
| Supprimer un ADMIN | ❌ | ❌ | ❌ | ✅ |
| Supprimer un SUPER_ADMIN | ❌ | ❌ | ❌ | ❌ |

---

### Cartes

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Créer une carte (limité) | ✅ | ✅ | ✅ | ✅ |
| Voir ses cartes | ✅ | ✅ | ✅ | ✅ |
| Créer une carte pour un client (sans limite) | ❌ | ❌ | ✅ | ✅ |
| Geler / dégeler sa propre carte (`PATCH /cards/:id`) | ✅ | ❌ | ✅ | ✅ |
| Voir la carte d'un autre user | ❌ | ❌ | ✅ | ✅ |

---

### Tontines

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Créer une tontine | ✅ | ✅ | ✅ | ✅ |
| Rejoindre via lien d'invitation | ✅ | ✅ | ✅ | ✅ |
| Démarrer une tontine (créateur) | ✅ | ✅ | ✅ | ✅ |
| Voir toutes les tontines (`GET /tontines/admin/all`) | ❌ | ❌ | ✅ | ✅ |

---

### Audit & Config

| Action | CLIENT | COMPLIANCE | ADMIN | SUPER_ADMIN |
|--------|--------|-----------|-------|-------------|
| Voir ses propres logs d'activité | ✅ | ✅ | ✅ | ✅ |
| Voir tous les audit logs | ❌ | ✅ | ✅ | ✅ |
| Exporter audit logs (CSV/JSON) | ❌ | ✅ | ✅ | ✅ |
| Lire la config système | ❌ | ❌ | ❌ | ✅ |
| Modifier la config système | ❌ | ❌ | ❌ | ✅ |
| Activer le mode maintenance | ❌ | ❌ | ❌ | ✅ |

---

## Comment ça fonctionne techniquement

```
Request → JwtAuthGuard        → vérifie le JWT, injecte req.user
        → RolesGuard           → lit @Roles('ADMIN') sur le controller
                               → si user.role === 'SUPER_ADMIN' → bypass total
                               → sinon vérifie si role est dans la liste
        → Controller logic     → vérifications métier (ex: ADMIN ne peut pas modifier ADMIN)
        → MaintenanceMiddleware → si maintenance_mode=true → 503 sauf ADMIN+SUPER_ADMIN
```

**Token JWT** contient : `{ id, email, role }` — le rôle est lu directement depuis le token, pas de DB lookup à chaque requête.