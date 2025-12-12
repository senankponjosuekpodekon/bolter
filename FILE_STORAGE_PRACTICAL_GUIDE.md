# 🗂️ Gestion des Fichiers - Guide Pratique

## Résumé Rapide

| Aspect                                 | Détails                                                    |
| -------------------------------------- | ---------------------------------------------------------- |
| **Où sont stockés les fichiers KYC ?** | **Supabase Storage** (cloud sécurisé)                      |
| **Où sont stockées les métadonnées ?** | **Base de données PostgreSQL** (table `kyc_documents`)     |
| **Types de fichiers acceptés**         | JPG, PNG, PDF (max 5 MB)                                   |
| **Qui peut accéder ?**                 | Utilisateur (ses docs) + Admins (tous) + Compliance (tous) |
| **Photos de profil**                   | À implémenter (prévu)                                      |
| **Coût du stockage**                   | Inclus dans forfait Supabase                               |

---

## 📦 Flux d'Upload Visuel

```
UTILISATEUR
    │
    ├─ Sélectionne un fichier (JPG/PNG/PDF)
    │  (max 5 MB)
    │
    ▼
VALIDATION FRONTEND (KYC.tsx)
    │
    ├─ Vérifier la taille
    ├─ Vérifier le format
    └─ Vérifier le type de document
    │
    ▼
ENVOI API
    │
    └─ POST /api/kyc/documents
       {
         documentType: "ID_CARD",
         filePath: "/uploads/id_card.pdf",
         fileSize: 1024000,
         mimeType: "application/pdf"
       }
    │
    ▼
BACKEND (KycService)
    │
    ├─ Valider les données
    ├─ Insérer métadonnées en BD
    │  (status = PENDING)
    └─ Déclencher audit log
    │
    ▼
SUPABASE STORAGE (kyc-documents)
    │
    └─ Stocker le fichier physique
       kyc-documents/{userId}/id_card.pdf
    │
    ▼
BASE DE DONNÉES
    │
    └─ Enregistrement créé:
       {
         id: "uuid-123",
         user_id: "uuid-user",
         document_type: "ID_CARD",
         status: "PENDING",
         created_at: "2024-12-12T10:30:00Z"
       }
    │
    ▼
FRONTEND (KYC.tsx)
    │
    └─ Afficher le statut:
       ⏳ PENDING - En attente de révision
       ✅ APPROVED - Approuvé!
       ❌ REJECTED - Motif du rejet

```

---

## 📋 Exemple Complet - Cycle de vie d'un document

### Étape 1️⃣ - Utilisateur upload son ID

**Frontend (KYC.tsx):**

```jsx
<div>
  <h3>Pièce d'identité</h3>
  <input
    type="file"
    accept="image/*,application/pdf"
    onChange={(e) => {
      const file = e.target.files[0];
      handleFileUpload("ID_CARD", file);
    }}
  />
</div>
```

**Requête API envoyée:**

```http
POST http://localhost:3000/api/kyc/documents
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "documentType": "ID_CARD",
  "filePath": "/uploads/id_card_1702234567.pdf",
  "fileSize": 2048000,
  "mimeType": "application/pdf"
}
```

### Étape 2️⃣ - Métadonnées sauvegardées en BD

**Insertion en BD:**

```sql
INSERT INTO kyc_documents (
  id, user_id, document_type, file_path,
  file_size, mime_type, status, created_at
) VALUES (
  'e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b',
  'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p',
  'ID_CARD',
  '/uploads/id_card_1702234567.pdf',
  2048000,
  'application/pdf',
  'PENDING',
  '2024-12-12T10:30:00.000Z'
);
```

**Fichier stocké dans Supabase:**

```
kyc-documents/
└── a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p/
    └── id_card_1702234567.pdf (2 MB)
```

### Étape 3️⃣ - Frontend affiche le statut

**Affichage utilisateur:**

```
┌─────────────────────────────────────┐
│ 📄 Pièce d'identité                 │
├─────────────────────────────────────┤
│                                     │
│  ⏳ PENDING (En attente)           │
│                                     │
│  📅 Uploadé: 12/12/2024 10:30     │
│  🕐 Vérification: en cours...      │
│                                     │
└─────────────────────────────────────┘
```

### Étape 4️⃣ - Admin examine le document

**Accès admin panel:**

```
GET /api/kyc/documents/pending
Authorization: Bearer {admin_token}

Réponse:
[
  {
    id: "e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b",
    document_type: "ID_CARD",
    user_id: "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p",
    user_email: "john@example.com",
    user_name: "John Doe",
    status: "PENDING",
    created_at: "2024-12-12T10:30:00Z",
    file_path: "/uploads/id_card_1702234567.pdf"
  }
]
```

**Admin approuve le document:**

```http
PATCH /api/kyc/documents/e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b/review
Authorization: Bearer {admin_token}

{
  "approved": true,
  "rejectionReason": null
}
```

### Étape 5️⃣ - Statut mis à jour en BD

**Mise à jour du document:**

```sql
UPDATE kyc_documents
SET
  status = 'APPROVED',
  reviewed_at = '2024-12-12T14:30:00Z',
  reviewed_by = 'admin-uuid-123'
WHERE id = 'e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b';
```

### Étape 6️⃣ - KYC statut global recalculé

**Logique:**

```typescript
// Vérifier les 3 docs requis
documents = [
  { type: 'ID_CARD', status: 'APPROVED' },       ✅
  { type: 'SELFIE', status: 'REJECTED' },        ❌
  { type: 'PROOF_ADDRESS', status: 'PENDING' }   ⏳
]

// Au moins 1 rejeté → kyc_status = 'REJECTED'
UPDATE users
SET kyc_status = 'REJECTED'
WHERE id = 'a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p';
```

### Étape 7️⃣ - Frontend notifie l'utilisateur

**Affichage mis à jour:**

```
┌─────────────────────────────────────┐
│ 📄 Pièce d'identité                 │
├─────────────────────────────────────┤
│                                     │
│  ✅ APPROVED (Approuvé!)           │
│                                     │
│  📅 Uploadé: 12/12/2024 10:30     │
│  🔍 Vérifié: 12/12/2024 14:30     │
│                                     │
└─────────────────────────────────────┘

Motif du rejet pour Selfie:
❌ "Photo floue ou trop petite"
👉 Veuillez renvoyer une meilleure photo
```

---

## 🔑 Points Clés de Sécurité

### 1. **Row Level Security (RLS)**

Chaque utilisateur ne peut voir que ses fichiers :

```sql
-- Exemple: Utilisateur A ne peut PAS voir les fichiers d'Utilisateur B
Utilisateur A (UUID: a111...):
  GET /api/kyc/documents → Voit ses docs UNIQUEMENT

Utilisateur B (UUID: b222...):
  GET /api/kyc/documents → Voit ses docs UNIQUEMENT

Admin (role: ADMIN):
  GET /api/kyc/documents/pending → Voit TOUS les docs
```

### 2. **Chiffrement des données**

```
SUPABASE
├─ En transit (TLS 1.3)
│  Client ←→ (HTTPS) ←→ Serveur
│
└─ Au repos (AES-256)
   Disque physique = données chiffrées
```

### 3. **Audit Trail complet**

```sql
-- Chaque action est loggée
INSERT INTO kyc_audit_log VALUES:
- 10:30 - User 'john@example.com' uploads ID_CARD
- 14:30 - Admin 'compliance@example.com' APPROVES document
- Date d'expiration future documents
```

---

## 📊 Structure de la BD

### Table : `kyc_documents`

```
┌─────────────────────────────────────────────────────────┐
│ kyc_documents                                           │
├─────────────┬──────────────┬──────────────┬─────────────┤
│ id (UUID)   │ user_id      │ doc_type     │ status      │
├─────────────┼──────────────┼──────────────┼─────────────┤
│ e5f3a1b2    │ a1b2c3d4     │ ID_CARD      │ APPROVED    │
│ c4d5e6f7    │ a1b2c3d4     │ SELFIE       │ REJECTED    │
│ b3c4d5e6    │ a1b2c3d4     │ PROOF_ADDR   │ PENDING     │
│ d2e3f4a5    │ c5d6e7f8     │ ID_CARD      │ APPROVED    │
└─────────────┴──────────────┴──────────────┴─────────────┘

Colonnes additionnelles:
├─ file_path: "/uploads/id_card_1702234567.pdf"
├─ file_size: 2048000 (bytes)
├─ mime_type: "application/pdf"
├─ created_at: "2024-12-12T10:30:00Z"
├─ reviewed_at: "2024-12-12T14:30:00Z"
├─ reviewed_by: "admin-uuid-123"
└─ rejection_reason: "Photo floue"
```

### Table : `users` (colonnes KYC)

```
┌────────────────────────────────────────┐
│ users                                  │
├────────────────┬──────────────────┐────┤
│ id             │ kyc_status       │ ... │
├────────────────┼──────────────────┼────┤
│ a1b2c3d4...    │ REJECTED         │ ... │
│ c5d6e7f8...    │ APPROVED         │ ... │
│ b3c4d5e6...    │ SUBMITTED        │ ... │
│ d2e3f4a5...    │ PENDING          │ ... │
└────────────────┴──────────────────┴────┘

kyc_status valeurs:
- PENDING: N'a pas commencé
- SUBMITTED: Tous les docs uploadés
- APPROVED: Tous approuvés ✅
- REJECTED: Au moins 1 rejeté ❌
```

---

## 🗄️ Supabase Storage Structure

```
Buckets
├── kyc-documents (Privé)
│   │
│   ├── a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p/
│   │   ├── id_card_1702234567.pdf (2 MB)
│   │   ├── selfie_1702234568.jpg (1.5 MB)
│   │   └── proof_address_1702234569.png (3 MB)
│   │
│   ├── c5d6e7f8-a9b0-1c2d-3e4f-5g6h7i8j9k0l/
│   │   ├── id_card_1702234600.pdf (2.1 MB)
│   │   └── selfie_1702234601.jpg (1.8 MB)
│   │
│   └── [... autres utilisateurs ...]
│
└── profile-photos (Privé) [À CRÉER]
    │
    ├── a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p/
    │   ├── avatar_current.jpg (500 KB)
    │   └── avatar_backup_1702234567.jpg (500 KB)
    │
    └── [... autres utilisateurs ...]
```

---

## 🎯 Cas d'Usage

### ✅ Cas 1 : Upload et Validation Réussie

```
John veut transfert un montant important ($5000)
    ↓
App demande: "Complétez votre KYC"
    ↓
John upload:
  - ID Card ✅ APPROVED
  - Selfie ✅ APPROVED
  - Proof of Address ✅ APPROVED
    ↓
kyc_status = APPROVED
    ↓
John peut maintenant transférer $5000 ✅
```

### ❌ Cas 2 : Rejet et Renvoi

```
Jane upload son ID
    ↓
Admin examine → "Photo floue"
    ↓
Status = REJECTED
Motif: "Photo is not clear enough"
    ↓
Frontend affiche:
  ❌ ID Card - REJECTED
  📋 Reason: "Photo is not clear enough"
  👉 Please resubmit
    ↓
Jane upload une meilleure photo
    ↓
Admin approuve ✅
    ↓
kyc_status = APPROVED (si tous les docs OK)
```

### 🔄 Cas 3 : Documents Multiples

```
Mike doit compléter 3 documents:

Timeline:
- Day 1: Upload ID Card → PENDING
- Day 2: Admin approves → APPROVED ✅
- Day 3: Upload Selfie → PENDING
- Day 4: Admin approves → APPROVED ✅
- Day 5: Upload Proof of Address → PENDING
- Day 6: Admin approves → APPROVED ✅

kyc_status evolution:
Day 1: PENDING (0/3)
Day 2: SUBMITTED (1/3 approved)
Day 3: SUBMITTED (1/3 approved)
Day 4: SUBMITTED (2/3 approved)
Day 5: SUBMITTED (2/3 approved)
Day 6: APPROVED (3/3 approved) ✅
```

---

## 📈 Quotas et Limites

| Paramètre                 | Limite           | Notes                   |
| ------------------------- | ---------------- | ----------------------- |
| Taille max/fichier        | 5 MB             | Configurable            |
| Types acceptés            | JPG, PNG, PDF    | Extensible              |
| Documents par utilisateur | ∞                | Stockage cloud illimité |
| Espace total disque       | 1 GB (gratuit)   | Supabase Pro: 100 GB    |
| Temps de rétention        | ∞                | Stockage permanent      |
| URL signée durée          | 1 heure (custom) | Par défaut              |

---

## 🚨 Problèmes Courants & Solutions

### Problème 1: Upload échoue

```
Erreur: "413 Payload Too Large"
Cause: Fichier > 5 MB
Solution: Compresser le fichier ou augmenter la limite
```

### Problème 2: Fichier visible à d'autres utilisateurs

```
Erreur: "Utilisateur A voit fichiers d'Utilisateur B"
Cause: RLS non activé
Solution: Vérifier les politiques Supabase
```

### Problème 3: Admin ne peut pas voir les documents

```
Erreur: "Admin n'a accès à aucun document"
Cause: Rôle mal configuré
Solution: Vérifier role='admin' en BD
```

### Problème 4: Document approuvé mais KYC reste REJECTED

```
Erreur: "kyc_status ne se met pas à jour"
Cause: updateUserKycStatus() non appelé
Solution: Vérifier que updateUserKycStatus() est appelé après review
```

---

## 📞 Annexe - Contacts et Support

**Questions technique?**

- Slack: #backend-support
- Email: tech@company.com

**Problème de sécurité?**

- Email: security@company.com (confidentiel)

**Demande d'augmentation d'espace?**

- Contact: DevOps team

---

**Version:** 1.0  
**Dernière maj:** 12 décembre 2024  
**Statut:** ✅ En production (KYC)
