# Cards Module - Quick Test Guide

## Step 1: Migration ✅

La table `cards` a été créée dans Supabase.

## Step 2: Test via Frontend (Accounts page)

### Path: apps/client/src/pages/Accounts.tsx

1. **Ouvrez l'application client**

   ```bash
   cd apps/client && npm run dev
   ```

2. **Allez sur la page Accounts**
   - URL: `http://localhost:5173/accounts`

3. **Créez un compte d'abord** (si vous n'en avez pas)
   - Type: SAVINGS ou CHECKING
   - Currency: EUR, USD, ou GBP
   - Limit: 1000 (ou votre choix)
   - Click "Create Account"

4. **Créez une carte**
   - Scroll down à "Manage Cards"
   - Click "Create Card"
   - Sélectionnez le compte
   - Type: VIRTUAL ou PHYSICAL
   - Click "Create Card"

5. **Vérifiez le succès**
   - Vous devriez voir un message: "Carte créée avec succès"
   - La carte s'affiche avec son numéro (\*\*\*\*)

---

## Step 3: Test via API (Postman ou curl)

### 1. Obtenir un token JWT

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

Gardez le `accessToken` de la réponse.

### 2. Créer une carte

```bash
curl -X POST http://localhost:3000/api/cards \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "your-account-uuid",
    "type": "VIRTUAL"
  }'
```

**Response exemple:**

```json
{
  "id": "uuid-here",
  "account_id": "uuid-here",
  "card_number": "4123456789123456",
  "type": "VIRTUAL",
  "status": "ACTIVE",
  "cvv": "123",
  "expiry_date": "12/2029",
  "created_at": "2025-12-08T10:00:00Z"
}
```

### 3. Récupérer les cartes d'un compte

```bash
curl -X GET http://localhost:3000/api/cards/account/YOUR_ACCOUNT_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Bloquer une carte

```bash
curl -X PATCH http://localhost:3000/api/cards/CARD_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "BLOCKED"
  }'
```

### 5. Supprimer une carte

```bash
curl -X DELETE http://localhost:3000/api/cards/CARD_UUID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Troubleshooting

### Erreur: "Account with ID not found"

- **Cause**: L'accountId n'existe pas ou n'appartient pas à l'utilisateur
- **Solution**: Vérifiez le UUID du compte, créez-en un nouveau

### Erreur: "Card type must be VIRTUAL or PHYSICAL"

- **Cause**: Type invalide
- **Solution**: Utilisez seulement "VIRTUAL" ou "PHYSICAL"

### Erreur: "Unauthorized"

- **Cause**: Token JWT invalide ou expiré
- **Solution**: Reconnectez-vous et obtenez un nouveau token

### Erreur: "Card with ID not found" (PATCH/DELETE)

- **Cause**: L'ID de la carte n'existe pas
- **Solution**: Vérifiez l'ID, créez une nouvelle carte d'abord

---

## Database Check

Pour vérifier que les cartes sont créées dans Supabase:

1. Allez à https://app.supabase.com
2. Sélectionnez votre projet
3. Allez à "Table Editor"
4. Sélectionnez la table `cards`
5. Vous devriez voir les cartes créées

---

## Expected Features

✅ Créer des cartes virtuelles et physiques
✅ Numéro de carte généré automatiquement
✅ CVV et date d'expiration générés
✅ Blocage/déblocage de cartes
✅ Suppression de cartes
✅ Logs d'audit
✅ Notifications par email

---

## Files to Check

- ✅ Backend: `/apps/server/src/cards/` (complet)
- ✅ Frontend: `/apps/client/src/pages/Accounts.tsx` (prêt)
- ✅ Database: `cards` table in Supabase
- ✅ Types: `/apps/client/src/types/index.ts` (mise à jour si besoin)
