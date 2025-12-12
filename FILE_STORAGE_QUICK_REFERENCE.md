# ⚡ TL;DR - Gestion des Fichiers

## En 30 secondes 🚀

**Q: Où sont stockés les fichiers KYC?**  
A: **Supabase Cloud Storage** (AWS S3 chiffré)

**Q: Où sont les métadonnées?**  
A: **PostgreSQL** table `kyc_documents`

**Q: Qui peut voir les fichiers?**  
A: L'utilisateur (les siens) + Admins (tous)

**Q: Types acceptés?**  
A: JPG, PNG, PDF (max 5 MB)

**Q: Comment ça marche?**

```
Utilisateur upload → API backend → Métadonnées en BD →
Fichier en Supabase → Admin examine → Approuve/Rejete →
Status change → Utilisateur notifié
```

---

## 📋 Fichiers Importants

| Fichier                         | Rôle                           |
| ------------------------------- | ------------------------------ |
| `apps/client/src/pages/KYC.tsx` | Frontend upload UI             |
| `src/kyc/kyc.service.ts`        | Logique backend                |
| `src/kyc/kyc.controller.ts`     | API endpoints                  |
| `kyc_documents` (table BD)      | Métadonnées des docs           |
| `kyc-documents` (bucket)        | Stockage physique des fichiers |

---

## 🔗 Flux Principal

```
1️⃣ Upload          User sélectionne fichier
2️⃣ Validation      Frontend vérifie taille/format
3️⃣ Envoi           POST /api/kyc/documents
4️⃣ Métadonnées     Sauvegarde en base
5️⃣ Fichier         Stockage Supabase
6️⃣ Statut          PENDING (en attente admin)
7️⃣ Review Admin    Admin approuve/rejete
8️⃣ Notification    User voit le résultat
```

---

## 🔐 Sécurité

✅ **Row Level Security** - Chacun ne voit que ses docs  
✅ **Chiffrement** - AES-256 au repos + TLS en transit  
✅ **Audit Trail** - Log de chaque action  
✅ **Authentification** - JWT token obligatoire

---

## 📊 Statuts Document

| Statut   | Sens                   | Icône |
| -------- | ---------------------- | ----- |
| PENDING  | En attente de révision | ⏳    |
| APPROVED | Approuvé par admin     | ✅    |
| REJECTED | Rejeté (motif fourni)  | ❌    |

---

## 👤 Statut KYC Global (User)

| Statut    | Sens                                      |
| --------- | ----------------------------------------- |
| PENDING   | N'a pas commencé ou docs manquants        |
| SUBMITTED | Tous les docs uploadés, révision en cours |
| APPROVED  | Tous approuvés → Débloquer features       |
| REJECTED  | Min. 1 rejeté → Renvoyer                  |

---

## 📱 Frontend - Affichage Utilisateur

```jsx
// 3 documents requis
├─ 📄 Pièce d'identité
│  └─ [Status: ✅ APPROVED | ⏳ PENDING | ❌ REJECTED]
│
├─ 🤳 Selfie
│  └─ [Status: ✅ APPROVED | ⏳ PENDING | ❌ REJECTED]
│
└─ 🏠 Justificatif de domicile
   └─ [Status: ✅ APPROVED | ⏳ PENDING | ❌ REJECTED]

// Résumé global
KYC Status: APPROVED → 🟢 Tous les documents requis sont validés
```

---

## 🖥️ Backend - API Endpoints

### User endpoints

```
POST   /api/kyc/documents              → Upload doc
GET    /api/kyc/documents              → Voir mes docs
```

### Admin endpoints

```
GET    /api/kyc/documents/pending      → Voir docs à vérifier
PATCH  /api/kyc/documents/{id}/review  → Approuver/Rejeter
```

---

## 🗄️ Structure BD Simplifiée

```sql
-- Table: kyc_documents
├─ id: UUID
├─ user_id: UUID (lien vers utilisateur)
├─ document_type: VARCHAR (ID_CARD, SELFIE, PROOF_ADDRESS)
├─ file_path: VARCHAR (/uploads/filename)
├─ file_size: INT (bytes)
├─ mime_type: VARCHAR (image/jpeg, application/pdf)
├─ status: VARCHAR (PENDING, APPROVED, REJECTED)
├─ created_at: TIMESTAMP (quand uploadé)
├─ reviewed_at: TIMESTAMP (quand vérifié)
├─ reviewed_by: UUID (admin qui a vérifié)
└─ rejection_reason: TEXT (motif rejet si applicable)
```

---

## 💾 Supabase Storage

```
Bucket: kyc-documents (Privé)
├── {userId}/
│   ├── id_card_1702234567.pdf
│   ├── selfie_1702234568.jpg
│   └── proof_address_1702234569.png
```

**Limites:**

- Taille max fichier: 5 MB
- Formats: JPG, PNG, PDF
- Chiffrement: AES-256
- Backup: Automatique

---

## 🚀 Ce qui fonctionne déjà ✅

- ✅ Upload documents KYC
- ✅ Stockage Supabase
- ✅ Métadonnées BD
- ✅ Admin review
- ✅ Statut workflow
- ✅ RLS security
- ✅ Audit logging

---

## ⏳ À Implémenter

- 📸 Photos de profil
- 🖼️ Avatar upload
- 🤖 OCR scanning
- 🔍 Anti-fraud detection
- 📦 Bulk processing

---

## 🔍 Vérifier le statut

**Frontend:**

```jsx
// Voir ses documents
GET /api/kyc/documents
→ [{ document_type, status, created_at, ... }]
```

**Admin:**

```jsx
// Voir docs en attente
GET /api/kyc/documents/pending
→ [{ user_id, document_type, status, ... }]
```

**Supabase Dashboard:**

```
Storage → kyc-documents
→ Voir tous les fichiers stockés
```

---

## 📞 Support Rapide

**Problème:** Upload échoue  
**Solution:** Vérifier taille < 5 MB et format

**Problème:** Document ne s'affiche pas  
**Solution:** Vérifier JWT token et RLS permissions

**Problème:** Admin ne peut pas voir les docs  
**Solution:** Vérifier role = 'admin' en BD

---

## 📚 Docs Complètes

- **FILE_STORAGE_SYSTEM.md** - Documentation complète
- **FILE_STORAGE_PRACTICAL_GUIDE.md** - Exemples pratiques
- **FILE_STORAGE_TECHNICAL_DIAGRAM.md** - Diagrammes techniques

---

**Version:** 1.0  
**Date:** 12 décembre 2024  
**Status:** ✅ Production (KYC)
