# 📁 Système de Gestion des Fichiers (KYC et Photos de Profil)

## Vue d'ensemble

L'application utilise **Supabase Storage** pour gérer et sauvegarder les fichiers :

- **Documents KYC** (Pièce d'identité, Selfie, Justificatif de domicile)
- **Photos de profil** (À implémenter)
- **Autres fichiers** (Avatar, documents supplémentaires)

---

## 🏗️ Architecture Actuelle

### 1. **Backend - Supabase Storage**

#### Bucket configuré : `kyc-documents`

- **Stockage** : Cloud (Supabase)
- **Taille max par fichier** : 5 MB
- **Formats autorisés** : JPG, PNG, PDF
- **Visibilité** : Privé (authentification requise)
- **Réplication** : Automatique (redondance géographique)

#### Structure du bucket :

```
kyc-documents/
├── {userId}/
│   ├── id_card_1702234567.pdf
│   ├── selfie_1702234568.jpg
│   └── proof_address_1702234569.png
```

---

## 📊 Base de Données - Métadonnées des fichiers

### Table : `kyc_documents`

```sql
CREATE TABLE kyc_documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  document_type VARCHAR(50),  -- ID_CARD, SELFIE, PROOF_ADDRESS
  file_path VARCHAR(255),     -- /storage/kyc-documents/{userId}/filename
  file_size INTEGER,          -- Taille en bytes
  mime_type VARCHAR(50),      -- image/jpeg, application/pdf, etc.
  status VARCHAR(50),         -- PENDING, APPROVED, REJECTED
  created_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  reviewed_by UUID,           -- Admin qui a vérifié
  rejection_reason TEXT,      -- Motif du rejet
  storage_url TEXT            -- URL Supabase pour accès direct
);

CREATE INDEX idx_kyc_user_id ON kyc_documents(user_id);
CREATE INDEX idx_kyc_status ON kyc_documents(status);
```

---

## 🔐 Sécurité & Row Level Security (RLS)

### Politiques Supabase Storage

**1. Lecture - Admins/Compliance**

```sql
CREATE POLICY "Admins can view kyc documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

**2. Upload - Utilisateurs (leur propre dossier)**

```sql
CREATE POLICY "Users can upload their own kyc documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

**3. Suppression - Admins uniquement**

```sql
CREATE POLICY "Admins can delete kyc documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

---

## 🖥️ Implémentation Frontend

### Composant React : `KYC.tsx`

#### Étapes du flux d'upload :

```typescript
// 1. L'utilisateur sélectionne un fichier
const handleFileUpload = async (documentType: string, file: File) => {
  setUploading(true);
  const filePath = `/uploads/${file.name}`;  // Chemin relatif

  // 2. Envoi au backend
  await uploadDocument.mutateAsync({
    documentType,      // ID_CARD, SELFIE, PROOF_ADDRESS
    filePath,          // Chemin dans le bucket
    fileSize: file.size,
    mimeType: file.type,
  });

  setUploading(false);
};

// 3. Requête API
POST /api/kyc/documents
{
  "documentType": "ID_CARD",
  "filePath": "/uploads/id_card.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

### État de l'Upload

```typescript
// États affichés à l'utilisateur
interface DocumentStatus {
  status: "PENDING" | "APPROVED" | "REJECTED";
  uploaded_date: string;
  reviewed_at?: string;
  rejection_reason?: string;
}
```

#### Affichage selon le statut :

| Statut      | Couleur | Icône | Info                       |
| ----------- | ------- | ----- | -------------------------- |
| PENDING     | Gris    | ⏳    | En attente de vérification |
| APPROVED    | Vert    | ✅    | Approuvé (KYC complété)    |
| REJECTED    | Rouge   | ❌    | Rejeté avec motif          |
| Non uploadé | -       | 📤    | Bouton d'upload            |

---

## 🔄 Flux Complet d'Upload

```
┌─────────────────────────────────────────┐
│ 1. Utilisateur sélectionne un fichier   │
│    (JPG, PNG, PDF - max 5MB)            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 2. Frontend valide le fichier             │
│    - Taille ✓                            │
│    - Format ✓                            │
│    - Type de document ✓                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 3. POST /api/kyc/documents               │
│    Envoyer métadonnées au backend        │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 4. Backend (KycService)                  │
│    - Valide données                      │
│    - Insère en base kyc_documents        │
│    - Status = PENDING                    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 5. Supabase Storage                      │
│    - Stocke le fichier physique          │
│    - Bucket: kyc-documents               │
│    - Chemin: {userId}/{filename}         │
│    - Génère URL d'accès                  │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 6. Admin Review                          │
│    - Consulte document en admin panel    │
│    - APPROVE ou REJECT                   │
│    - Mise à jour kyc_documents.status    │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│ 7. KYC Status Update                     │
│    Si tous les docs approuvés:           │
│    users.kyc_status = 'APPROVED'         │
│    → Débloque les fonctionnalités        │
└──────────────────────────────────────────┘
```

---

## 📝 Service Backend : `KycService`

### Fichier : `/apps/server/src/kyc/kyc.service.ts`

```typescript
@Injectable()
export class KycService {
  constructor(private supabase: SupabaseService) {}

  // 1. Upload document
  async uploadDocument(userId: string, dto: UploadKycDocumentDto) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from("kyc_documents")
      .insert({
        user_id: userId,
        document_type: dto.documentType, // ID_CARD, SELFIE, PROOF_ADDRESS
        file_path: dto.filePath, // /uploads/filename
        file_size: dto.fileSize, // Bytes
        mime_type: dto.mimeType, // image/jpeg, etc.
        status: "PENDING", // En attente de révision
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    await this.updateUserKycStatus(userId); // Recalcule le statut KYC
    return data;
  }

  // 2. Récupérer les documents d'un utilisateur
  async findByUserId(userId: string) {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from("kyc_documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // 3. Récupérer tous les documents EN ATTENTE (pour admins)
  async findPendingDocuments() {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from("kyc_documents")
      .select(
        `
        *,
        users:user_id(id, email, first_name, last_name)
      `
      )
      .eq("status", "PENDING")
      .order("created_at", { ascending: true });

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  // 4. Examiner/Approuver/Rejeter un document (Admin)
  async reviewDocument(
    adminId: string,
    documentId: string,
    dto: ReviewKycDocumentDto
  ) {
    // Valide que le document existe et est en attente
    const { data: document, error: fetchError } = await this.supabase
      .getAdminClient()
      .from("kyc_documents")
      .select("*")
      .eq("id", documentId)
      .maybeSingle();

    if (fetchError || !document)
      throw new NotFoundException("Document not found");

    if (document.status !== "PENDING")
      throw new BadRequestException("Document has already been reviewed");

    // Met à jour le document
    const newStatus = dto.approved ? "APPROVED" : "REJECTED";
    const { data, error } = await this.supabase
      .getAdminClient()
      .from("kyc_documents")
      .update({
        status: newStatus,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        rejection_reason: dto.rejectionReason || null,
      })
      .eq("id", documentId)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    // Recalcule le statut KYC global de l'utilisateur
    await this.updateUserKycStatus(document.user_id);
    return data;
  }

  // 5. Recalcule le statut KYC global (PENDING/SUBMITTED/APPROVED/REJECTED)
  private async updateUserKycStatus(userId: string) {
    const documents = await this.findByUserId(userId);
    const requiredTypes = ["ID_CARD", "SELFIE", "PROOF_ADDRESS"];

    // Vérifie que tous les types requis sont présents
    const hasAllRequired = requiredTypes.every((type) =>
      documents.some((doc) => doc.document_type === type)
    );

    if (!hasAllRequired) {
      // Pas tous les documents requis
      await this.supabase
        .getAdminClient()
        .from("users")
        .update({ kyc_status: "PENDING" })
        .eq("id", userId);
      return;
    }

    // Tous les documents requis sont présents
    const hasPending = documents.some((doc) => doc.status === "PENDING");
    const hasRejected = documents.some((doc) => doc.status === "REJECTED");

    let kycStatus = "PENDING";
    if (hasPending)
      kycStatus = "SUBMITTED"; // En cours de vérification
    else if (hasRejected)
      kycStatus = "REJECTED"; // Au moins 1 rejeté
    else kycStatus = "APPROVED"; // Tous approuvés!

    await this.supabase
      .getAdminClient()
      .from("users")
      .update({ kyc_status: kycStatus })
      .eq("id", userId);
  }
}
```

---

## 🎯 Endpoints API

### Pour les utilisateurs

#### 1. Upload un document KYC

```http
POST /api/kyc/documents
Authorization: Bearer {token}

{
  "documentType": "ID_CARD",           // ID_CARD | SELFIE | PROOF_ADDRESS
  "filePath": "/uploads/id_card.pdf",
  "fileSize": 1024000,                 // En bytes
  "mimeType": "application/pdf"        // image/jpeg, image/png, application/pdf
}
```

**Réponse (201 Created):**

```json
{
  "id": "uuid-123",
  "user_id": "uuid-user",
  "document_type": "ID_CARD",
  "file_path": "/uploads/id_card.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "status": "PENDING",
  "created_at": "2024-12-12T10:30:00Z",
  "reviewed_at": null,
  "rejection_reason": null
}
```

#### 2. Récupérer mes documents KYC

```http
GET /api/kyc/documents
Authorization: Bearer {token}
```

**Réponse (200 OK):**

```json
[
  {
    "id": "uuid-1",
    "document_type": "ID_CARD",
    "status": "APPROVED",
    "created_at": "2024-12-01T10:00:00Z",
    "reviewed_at": "2024-12-02T15:30:00Z"
  },
  {
    "id": "uuid-2",
    "document_type": "SELFIE",
    "status": "PENDING",
    "created_at": "2024-12-12T10:30:00Z",
    "reviewed_at": null
  },
  {
    "id": "uuid-3",
    "document_type": "PROOF_ADDRESS",
    "status": "REJECTED",
    "created_at": "2024-12-05T14:00:00Z",
    "reviewed_at": "2024-12-06T09:00:00Z",
    "rejection_reason": "Document unclear, please resubmit"
  }
]
```

---

### Pour les admins/compliance

#### 3. Récupérer tous les documents EN ATTENTE

```http
GET /api/kyc/documents/pending
Authorization: Bearer {adminToken}
```

#### 4. Examiner/Approuver/Rejeter un document

```http
PATCH /api/kyc/documents/{documentId}/review
Authorization: Bearer {adminToken}

{
  "approved": false,
  "rejectionReason": "La photo du document est trop floue"
}
```

---

## 💾 Accès aux Fichiers Stockés

### Depuis Supabase Dashboard

1. Aller sur **Storage** → **kyc-documents**
2. Navigation : `{userId}/{filename}`
3. Options :
   - **Voir** : Affiche le fichier
   - **Copier URL** : Génère une URL publique/signée
   - **Supprimer** : Supprime le fichier

### Depuis l'API

```typescript
// Générer une URL signée (expire après 1 heure)
const { data } = await supabase.storage
  .from("kyc-documents")
  .createSignedUrl(`${userId}/id_card.pdf`, 3600);

console.log(data.signedUrl);
// https://xyzabc.supabase.co/storage/v1/object/sign/kyc-documents/...
```

### Depuis React

```typescript
// Dans KYC.tsx - Afficher un document
const downloadDocument = async (filePath: string) => {
  const { data, error } = await supabase.storage
    .from("kyc-documents")
    .download(filePath);

  if (error) throw error;

  // Créer un lien de téléchargement
  const blob = new Blob([data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "document.pdf";
  link.click();
};
```

---

## 🚀 Statuts KYC Global de l'Utilisateur

### Table `users.kyc_status`

```sql
-- Colonne dans la table users
ALTER TABLE users ADD COLUMN kyc_status VARCHAR(20) DEFAULT 'PENDING';

-- Valeurs possibles :
-- PENDING      : Pas encore commencé ou docs manquants
-- SUBMITTED    : Tous les docs uploadés, en attente de révision
-- APPROVED     : Tous les docs approuvés ✅
-- REJECTED     : Au moins un doc rejeté ❌
```

### Déblocage des Fonctionnalités

```typescript
// Dans le frontend - Guard
const KycGuard = ({ children }) => {
  const user = useAuth();

  if (user.kyc_status !== 'APPROVED') {
    return <KycModal message="Veuillez compléter votre KYC" />;
  }

  return children;  // Accès autorisé
};

// Utilisation
<KycGuard>
  <TransferForm /> {/* Transferts */}
  <WithdrawForm /> {/* Retraits */}
  <LoanApplicationForm /> {/* Emprunts */}
</KycGuard>
```

---

## 📸 Photos de Profil (À Implémenter)

### Planification

**Bucket Supabase :** `profile-photos`

```
profile-photos/
├── {userId}/
│   ├── avatar_current.jpg
│   └── avatar_backup_timestamp.jpg
```

**Table BD :**

```sql
ALTER TABLE users ADD COLUMN profile_photo_url TEXT;
ALTER TABLE users ADD COLUMN profile_photo_uploaded_at TIMESTAMP;
ALTER TABLE profiles ADD COLUMN cover_photo_url TEXT;
```

**Endpoint API :**

```http
POST /api/users/profile-photo
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "file": <binary>  -- JPG, PNG max 3MB
}
```

---

## 🔍 Audits & Conformité

### Logging des Actions

```sql
-- Table audit pour tracer chaque action
CREATE TABLE kyc_audit_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  admin_id UUID,
  action VARCHAR(50),     -- UPLOAD, APPROVE, REJECT, DELETE
  document_id UUID,
  document_type VARCHAR(50),
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  reason TEXT,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Conformité RGPD

- ✅ Droit à l'oubli : Suppression soft-delete des documents
- ✅ Traçabilité : Audit log de chaque action
- ✅ Encryption : TLS en transit + Supabase encryption at rest
- ✅ RLS : Row Level Security sur tous les buckets storage

---

## 🛠️ Maintenance & Support

### Vérifier l'espace disque utilisé

```sql
SELECT
  auth.uid() as user_id,
  SUM(size) / 1024 / 1024 as size_mb
FROM storage.objects
WHERE bucket_id = 'kyc-documents'
GROUP BY auth.uid()
ORDER BY size_mb DESC;
```

### Nettoyer les fichiers orphelins

```sql
-- Fichiers dont le document n'existe plus en BD
DELETE FROM storage.objects
WHERE bucket_id = 'kyc-documents'
  AND path NOT IN (
    SELECT file_path FROM kyc_documents
  )
  AND created_at < NOW() - INTERVAL '7 days';
```

### Monitorer les téléchargements

```sql
SELECT
  bucket_id,
  COUNT(*) as file_count,
  SUM(size) / 1024 / 1024 as total_size_mb
FROM storage.objects
GROUP BY bucket_id;
```

---

## 📚 Ressources Supabase

- [Storage Documentation](https://supabase.com/docs/guides/storage)
- [RLS for Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Signed URLs](https://supabase.com/docs/guides/storage/signing-urls)
- [CDN & Performance](https://supabase.com/docs/guides/storage/serving-static-files)

---

**Dernière mise à jour:** 12 décembre 2024  
**Responsable:** Équipe backend  
**Status:** ✅ Production (KYC), ⏳ À venir (Photos de profil)
