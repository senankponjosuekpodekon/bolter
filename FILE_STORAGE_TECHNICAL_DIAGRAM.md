# 🏗️ Architecture Technique - Gestion des Fichiers

## Vue Architecturale Globale

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UTILISATEUR                                 │
│  (Navigateur Web / Mobile - apps/client)                            │
└────────────────────┬────────────────────────────────────────────────┘
                     │
                     │ Upload File + Métadonnées
                     │ POST /api/kyc/documents
                     ▼
         ┌───────────────────────────────┐
         │  FRONTEND (KYC.tsx)           │
         ├───────────────────────────────┤
         │                               │
         │  1. Sélection fichier        │
         │  2. Validation taille/format │
         │  3. Envoi requête POST       │
         │  4. Affichage statut         │
         │                               │
         └────────┬──────────────────────┘
                  │
                  │ Requête HTTP(S)
                  │ + JWT Token
                  ▼
    ┌─────────────────────────────────────────┐
    │      NestJS Backend (apps/server)       │
    │                                         │
    │  ┌──────────────────────────────────┐   │
    │  │  KYC Controller                  │   │
    │  │  @Post('documents')              │   │
    │  │  @UseGuards(JwtAuthGuard)        │   │
    │  └────────────┬─────────────────────┘   │
    │               │                         │
    │               │ uploadDocument()        │
    │               ▼                         │
    │  ┌──────────────────────────────────┐   │
    │  │  KYC Service                     │   │
    │  │                                  │   │
    │  │  - Valide données                │   │
    │  │  - Insère en base                │   │
    │  │  - Appelle updateKycStatus()     │   │
    │  │  - Log audit trail               │   │
    │  └────────┬────────────┬────────────┘   │
    │           │            │                │
    │           ▼            ▼                │
    │   ┌─────────────┐ ┌─────────────┐       │
    │   │ Supabase    │ │  Logger     │       │
    │   │ Client      │ │  Service    │       │
    │   └─────────────┘ └─────────────┘       │
    │           │                             │
    └───────────┼─────────────────────────────┘
                │
                │ RPC + Auth Token
                │ (supabaseClient.auth.getSession())
                ▼
     ┌──────────────────────────────────────┐
     │   SUPABASE BACKEND                   │
     │                                      │
     │  ┌────────────────────────────────┐  │
     │  │ PostgreSQL Database            │  │
     │  │                                │  │
     │  │ Table: kyc_documents           │  │
     │  │ ├─ id                          │  │
     │  │ ├─ user_id                     │  │
     │  │ ├─ document_type               │  │
     │  │ ├─ file_path                   │  │
     │  │ ├─ status (PENDING/APPROVED..)│  │
     │  │ └─ ...                         │  │
     │  │                                │  │
     │  │ Table: users                   │  │
     │  │ ├─ kyc_status                  │  │
     │  │ └─ ...                         │  │
     │  └────────────────────────────────┘  │
     │                                      │
     │  ┌────────────────────────────────┐  │
     │  │ Storage Service                │  │
     │  │ (Bucket: kyc-documents)        │  │
     │  │                                │  │
     │  │ RLS Policies:                  │  │
     │  │ - Users see own files ✓        │  │
     │  │ - Admins see all files ✓       │  │
     │  │ - No public access ✓           │  │
     │  └────────────────────────────────┘  │
     │                                      │
     └──────────────────────────────────────┘
                │
                │ File stored physically
                ▼
     ┌──────────────────────────────────────┐
     │   Supabase Cloud Storage             │
     │   (AWS S3 under the hood)            │
     │                                      │
     │   kyc-documents/                     │
     │   └── {userId}/                      │
     │       ├── id_card.pdf (encrypted)    │
     │       ├── selfie.jpg (encrypted)     │
     │       └── proof_address.png (encr.)  │
     │                                      │
     │   Encryption: AES-256 at rest        │
     │   Replication: Multiple zones        │
     │   Backup: Automatic daily            │
     │                                      │
     └──────────────────────────────────────┘
```

---

## Flux de Données - Détail Technique

### Upload Flow Complet

```
┌─ CLIENT SIDE (React) ─────────────────────────────────────────┐
│                                                               │
│  Step 1: File Input                                          │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ <input type="file" onChange={handleFileUpload} />     │   │
│  │                                                       │   │
│  │ Event: File selected                                 │   │
│  │ File: { name, size, type, lastModified }            │   │
│  └──────────────────┬──────────────────────────────────┘   │
│                     │                                      │
│  Step 2: Validation (Frontend)                            │
│  │ ✓ fileSize < 5MB ?                                   │   │
│  │ ✓ fileType in [jpg, png, pdf] ?                      │   │
│  │ ✓ documentType in [ID_CARD, SELFIE, ...] ?           │   │
│  │                                                       │   │
│  │ Result: Valid ✓ → Proceed                            │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                     │                                      │
│  Step 3: Prepare Request                                  │
│  │ Path: `/uploads/${file.name}`                         │   │
│  │ Body:                                                │   │
│  │ {                                                    │   │
│  │   documentType: "ID_CARD",                           │   │
│  │   filePath: "/uploads/id_card_123456.pdf",           │   │
│  │   fileSize: 2048000,                                 │   │
│  │   mimeType: "application/pdf"                        │   │
│  │ }                                                    │   │
│  │                                                       │   │
│  │ Headers:                                            │   │
│  │ Authorization: Bearer {JWT_TOKEN}                    │   │
│  │ Content-Type: application/json                       │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                     │                                      │
│  Step 4: HTTP POST                                        │
│  └─ POST /api/kyc/documents ────────→                      │
│                                                           │
└───────────────────────────────────────────────────────────────┘

┌─ BACKEND SIDE (NestJS) ──────────────────────────────────────┐
│                                                              │
│  Step 5: Route Handler                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ @Controller('kyc')                                     │  │
│  │ @Post('documents')                                     │  │
│  │ @UseGuards(JwtAuthGuard)                               │  │
│  │ uploadDocument(@Req() req, @Body() dto) {              │  │
│  │   return this.kycService.uploadDocument(               │  │
│  │     req.user.id,  // JWT decoded                       │  │
│  │     dto           // Request body                       │  │
│  │   );                                                   │  │
│  │ }                                                      │  │
│  └──────────────────┬────────────────────────────────────┘   │
│                     │                                      │
│  Step 6: Service Logic                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ async uploadDocument(userId, dto) {                    │  │
│  │                                                        │  │
│  │   // 6.1: Validate user exists                        │  │
│  │   const user = await findUserById(userId);             │  │
│  │   if (!user) throw new UnauthorizedException();        │  │
│  │                                                        │  │
│  │   // 6.2: Validate document type                      │  │
│  │   if (!['ID_CARD', 'SELFIE', ...].includes(           │  │
│  │      dto.documentType))                               │  │
│  │     throw new BadRequestException();                   │  │
│  │                                                        │  │
│  │   // 6.3: Insert metadata to database                 │  │
│  │   const doc = await supabase                           │  │
│  │     .from('kyc_documents')                             │  │
│  │     .insert({                                          │  │
│  │       id: uuid(),              // NEW                 │  │
│  │       user_id: userId,                                 │  │
│  │       document_type: dto.documentType,                 │  │
│  │       file_path: dto.filePath,                         │  │
│  │       file_size: dto.fileSize,                         │  │
│  │       mime_type: dto.mimeType,                         │  │
│  │       status: 'PENDING',       // Default             │  │
│  │       created_at: NOW()                                │  │
│  │     })                                                 │  │
│  │     .select()                                          │  │
│  │     .single();                                         │  │
│  │                                                        │  │
│  │   // 6.4: Update user KYC status                      │  │
│  │   await updateUserKycStatus(userId);                   │  │
│  │                                                        │  │
│  │   // 6.5: Log audit trail                             │  │
│  │   await logger.info(                                   │  │
│  │     `User ${userId} uploaded ${docType}`              │  │
│  │   );                                                   │  │
│  │                                                        │  │
│  │   return doc;  // Return saved metadata               │  │
│  │ }                                                      │  │
│  └──────────────────┬────────────────────────────────────┘   │
│                     │                                      │
│  Step 7: Database Transaction                            │
│  │ Execute INSERT on kyc_documents table                 │   │
│  │                                                       │   │
│  │ Values:                                              │   │
│  │ ├─ id: e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b (UUID)  │   │
│  │ ├─ user_id: a1b2c3d4-e5f6... (JWT sub)              │   │
│  │ ├─ document_type: ID_CARD                            │   │
│  │ ├─ file_path: /uploads/id_card_123456.pdf            │   │
│  │ ├─ file_size: 2048000                                │   │
│  │ ├─ mime_type: application/pdf                        │   │
│  │ ├─ status: PENDING                                   │   │
│  │ └─ created_at: 2024-12-12T10:30:00Z                 │   │
│  │                                                       │   │
│  │ Result: Row created ✓                                │   │
│  └───────────────────┬────────────────────────────────────┘   │
│                     │                                      │
│  Step 8: HTTP Response 201                               │
│  │ Headers:                                             │   │
│  │ └─ Content-Type: application/json                    │   │
│  │                                                      │   │
│  │ Body:                                                │   │
│  │ {                                                    │   │
│  │   id: "e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b",      │   │
│  │   user_id: "a1b2c3d4-e5f6-4g7h-8i9j...",           │   │
│  │   document_type: "ID_CARD",                          │   │
│  │   file_path: "/uploads/id_card_123456.pdf",          │   │
│  │   file_size: 2048000,                                │   │
│  │   mime_type: "application/pdf",                      │   │
│  │   status: "PENDING",                                 │   │
│  │   created_at: "2024-12-12T10:30:00Z",               │   │
│  │   reviewed_at: null,                                 │   │
│  │   reviewed_by: null,                                 │   │
│  │   rejection_reason: null                             │   │
│  │ }                                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└────────────────────────────────────────────────────────────┘
        ↑
        │ HTTP 201 Created + JSON body
        │
┌─ CLIENT SIDE (React) ─────────────────────────────────────────┐
│                                                               │
│  Step 9: Update UI                                           │
│  ├─ Remove upload button                                    │
│  ├─ Display status: ⏳ PENDING                              │
│  ├─ Show upload timestamp                                  │
│  └─ Enable polling for status updates                      │
│                                                              │
│  Step 10: Polling (Frontend)                               │
│  ├─ GET /api/kyc/documents every 30 seconds               │
│  │  (Check for admin review)                              │
│  │                                                        │
│  │  Response:                                             │
│  │  [                                                     │
│  │    {                                                   │
│  │      id: "e5f3a1b2...",                              │
│  │      status: "PENDING"  ← Still waiting               │
│  │    }                                                   │
│  │  ]                                                     │
│  │                                                        │
│  └─ Continue polling...                                  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Review Admin Flow

```
┌─ ADMIN PANEL (React) ─────────────────────────────────────┐
│                                                           │
│  Admin visits KYC Review page                            │
│  │                                                       │
│  └─ GET /api/kyc/documents/pending                       │
│                                                           │
│     Response: Array of PENDING documents                 │
│     ┌─────────────────────────────────────────────────┐  │
│     │ {                                               │  │
│     │   id: "e5f3a1b2-c4d6-4e8f-9a0b-1c2d3e4f5a6b",  │  │
│     │   user_id: "a1b2c3d4-e5f6-4g7h-8i9j...",       │  │
│     │   document_type: "ID_CARD",                      │  │
│     │   file_path: "/uploads/id_card_123456.pdf",      │  │
│     │   status: "PENDING",                             │  │
│     │   created_at: "2024-12-12T10:30:00Z",           │  │
│     │   user: {                                        │  │
│     │     id: "a1b2c3d4...",                          │  │
│     │     email: "john@example.com",                   │  │
│     │     first_name: "John",                          │  │
│     │     last_name: "Doe"                             │  │
│     │   }                                              │  │
│     │ }                                                │  │
│     └─────────────────────────────────────────────────┘  │
│                                                           │
│  Admin reviews document:                                │
│  - View PDF/Image in modal                              │
│  - Zoom, rotate, enhance                                │
│  - Check validity                                       │
│                                                           │
│  Admin decision: APPROVE                                │
│  │                                                      │
│  └─ PATCH /api/kyc/documents/{id}/review               │
│     {                                                   │
│       "approved": true,                                │
│       "rejectionReason": null                          │
│     }                                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
        │
        ▼ (Backend processes)
┌─────────────────────────────────────────────────────┐
│ KycService.reviewDocument()                         │
│                                                     │
│ 1. Validate document exists & is PENDING            │
│    SELECT * FROM kyc_documents                      │
│    WHERE id = '{id}' AND status = 'PENDING'        │
│    Result: Found ✓                                  │
│                                                     │
│ 2. Update document status & review info            │
│    UPDATE kyc_documents SET                         │
│    ├─ status = 'APPROVED'                          │
│    ├─ reviewed_at = '2024-12-12T14:30:00Z'        │
│    ├─ reviewed_by = '{admin_id}'                   │
│    └─ rejection_reason = NULL                      │
│    WHERE id = '{id}'                               │
│    Result: Updated ✓                                │
│                                                     │
│ 3. Recalculate user KYC status                     │
│    SELECT * FROM kyc_documents                      │
│    WHERE user_id = '{user_id}'                     │
│                                                     │
│    Check:                                           │
│    ├─ ID_CARD: APPROVED ✓                          │
│    ├─ SELFIE: APPROVED ✓                           │
│    └─ PROOF_ADDRESS: APPROVED ✓                    │
│                                                     │
│    Logic: All approved → kyc_status = 'APPROVED'   │
│                                                     │
│    UPDATE users SET                                 │
│    kyc_status = 'APPROVED'                         │
│    WHERE id = '{user_id}'                          │
│                                                     │
│ 4. Return updated document                         │
│    Response 200 OK                                  │
│    {                                                │
│      id: "e5f3a1b2...",                           │
│      status: "APPROVED",                           │
│      reviewed_at: "2024-12-12T14:30:00Z",        │
│      reviewed_by: "admin-id-xyz"                   │
│    }                                               │
│                                                     │
└─────────────────────────────────────────────────────┘
        │
        ▼ (Polling in frontend detects change)
┌─ USER CLIENT (React) ──────────────────────────────────┐
│                                                        │
│ Frontend polling interval detects:                   │
│ GET /api/kyc/documents                               │
│                                                      │
│ Response:                                            │
│ [                                                    │
│   {                                                  │
│     id: "e5f3a1b2...",                             │
│     document_type: "ID_CARD",                        │
│     status: "APPROVED",  ← CHANGED!                 │
│     reviewed_at: "2024-12-12T14:30:00Z"            │
│   },                                                │
│   ...                                               │
│ ]                                                   │
│                                                      │
│ Frontend updates UI:                                 │
│ ┌──────────────────────────────────┐               │
│ │ 📄 ID Card                       │               │
│ ├──────────────────────────────────┤               │
│ │ ✅ APPROVED (12/12/2024 14:30)  │               │
│ └──────────────────────────────────┘               │
│                                                      │
│ (Repeat for each document until KYC_STATUS ALL ✅)  │
│                                                      │
└────────────────────────────────────────────────────────┘
```

---

## Base de Données Schema Visuel

```sql
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL (Supabase)                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Table: users                                              │
│  ┌──────────────────────────────────────────────┐          │
│  │ Column          Type         Constraints      │          │
│  ├──────────────────────────────────────────────┤          │
│  │ id              UUID         PRIMARY KEY      │          │
│  │ email           VARCHAR      UNIQUE, NOT NULL│          │
│  │ first_name      VARCHAR      NOT NULL        │          │
│  │ last_name       VARCHAR      NOT NULL        │          │
│  │ kyc_status      VARCHAR      DEFAULT PENDING │◄──┐      │
│  │ role            VARCHAR      DEFAULT CLIENT  │   │      │
│  │ created_at      TIMESTAMP    NOT NULL        │   │      │
│  └──────────────────────────────────────────────┘   │      │
│                                                        │      │
│  kyc_status values:                                  │      │
│  • PENDING      (0/3 docs ou docs manquants)         │      │
│  • SUBMITTED    (tous docs uploadés, 1+ en attente) │      │
│  • APPROVED     (tous docs approuvés) ✅             │      │
│  • REJECTED     (min. 1 rejeté) ❌                  │      │
│                                                        │      │
│  ┌─ Referenced by kyc_documents ────────────────────┘      │
│  │                                                        │
│  │  Table: kyc_documents                                  │
│  │  ┌───────────────────────────────────────────────┐    │
│  │  │ Column         Type         Constraints        │    │
│  │  ├───────────────────────────────────────────────┤    │
│  │  │ id             UUID         PRIMARY KEY        │    │
│  │  │ user_id        UUID         FOREIGN KEY→users │    │
│  │  │ document_type  VARCHAR      NOT NULL          │    │
│  │  │                             (ID_CARD,SELFIE..│    │
│  │  │ file_path      VARCHAR      NOT NULL          │    │
│  │  │ file_size      INT          NOT NULL          │    │
│  │  │ mime_type      VARCHAR      NOT NULL          │    │
│  │  │ status         VARCHAR      DEFAULT PENDING   │    │
│  │  │                             (PENDING/APP/REJ) │    │
│  │  │ created_at     TIMESTAMP    NOT NULL          │    │
│  │  │ reviewed_at    TIMESTAMP    NULLABLE          │    │
│  │  │ reviewed_by    UUID         FOREIGN KEY→users │    │
│  │  │ rejection_      TEXT        NULLABLE          │    │
│  │  │  reason                                       │    │
│  │  └───────────────────────────────────────────────┘    │
│  │                                                        │
│  │  Indexes:                                              │
│  │  • PRIMARY KEY (id)                                    │
│  │  • INDEX (user_id) - Fast lookup by user             │
│  │  • INDEX (status) - Fast filter by status            │
│  │  • UNIQUE (user_id, document_type) - One doc/type    │
│  │                                                        │
│  └────────────────────────────────────────────────────── │
│                                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Supabase Storage (AWS S3)                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Bucket: kyc-documents (Private)                           │
│                                                             │
│  Path structure:                                           │
│  kyc-documents/                                            │
│  └── a1b2c3d4-e5f6.../    (User ID folder)               │
│      ├── id_card_170223...pdf      (5 MB max)            │
│      ├── selfie_170223...jpg       (5 MB max)            │
│      └── proof_address...png       (5 MB max)            │
│                                                             │
│  File metadata:                                            │
│  • name: Path relative to bucket root                     │
│  • size: File size in bytes                               │
│  • created_at: Upload timestamp                           │
│  • updated_at: Last modified timestamp                    │
│  • content_type: MIME type                                │
│                                                             │
│  Encryption:                                              │
│  • At rest: AES-256                                       │
│  • In transit: TLS 1.3 / HTTPS                            │
│                                                             │
│  Replication:                                             │
│  • Multiple geographic zones                              │
│  • Automatic failover                                     │
│  • Daily backup snapshots                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## RLS Policies Diagram

```
┌────────────────────────────────────────────────────────────┐
│ Row Level Security (RLS) - Supabase Storage                │
└────────────────────────────────────────────────────────────┘

Policy 1: Users read own documents
┌──────────────────────────────────────────────────────────┐
│ CREATE POLICY "Users can view own kyc documents"        │
│ ON storage.objects                                      │
│ FOR SELECT                                              │
│ TO authenticated                                        │
│ USING (                                                 │
│   bucket_id = 'kyc-documents'                          │
│   AND (storage.foldername(name))[1] = auth.uid()       │
│                                            ↑             │
│                    Path extraction: /userId/file.pdf    │
│ )                                                       │
│                                                         │
│ Result:                                                 │
│ User A (id: 111...):                                    │
│   ✓ Can access kyc-documents/111.../id_card.pdf        │
│   ✗ Cannot access kyc-documents/222.../id_card.pdf     │
│                                                         │
└──────────────────────────────────────────────────────────┘

Policy 2: Admins read all documents
┌──────────────────────────────────────────────────────────┐
│ CREATE POLICY "Admins can view all kyc documents"       │
│ ON storage.objects                                      │
│ FOR SELECT                                              │
│ TO authenticated                                        │
│ USING (                                                 │
│   bucket_id = 'kyc-documents'                          │
│   AND EXISTS (                                          │
│     SELECT 1 FROM users                                │
│     WHERE users.id = auth.uid()                        │
│     AND users.role = 'admin'                           │
│   )                                                     │
│ )                                                       │
│                                                         │
│ Result:                                                 │
│ Admin (role: 'admin'):                                  │
│   ✓ Can access kyc-documents/111.../id_card.pdf        │
│   ✓ Can access kyc-documents/222.../id_card.pdf        │
│   ✓ Can see ALL files in bucket                        │
│                                                         │
└──────────────────────────────────────────────────────────┘

Policy 3: Users upload to own folder
┌──────────────────────────────────────────────────────────┐
│ CREATE POLICY "Users can upload own kyc documents"      │
│ ON storage.objects                                      │
│ FOR INSERT                                              │
│ TO authenticated                                        │
│ WITH CHECK (                                            │
│   bucket_id = 'kyc-documents'                          │
│   AND (storage.foldername(name))[1] =                  │
│       auth.uid()::text                                 │
│ )                                                       │
│                                                         │
│ Result:                                                 │
│ User A (id: 111...):                                    │
│   ✓ Can upload to kyc-documents/111.../new_file.pdf    │
│   ✗ Cannot upload to kyc-documents/222.../file.pdf    │
│                                                         │
└──────────────────────────────────────────────────────────┘

Policy 4: Admins delete files
┌──────────────────────────────────────────────────────────┐
│ CREATE POLICY "Admins can delete kyc documents"         │
│ ON storage.objects                                      │
│ FOR DELETE                                              │
│ TO authenticated                                        │
│ USING (                                                 │
│   bucket_id = 'kyc-documents'                          │
│   AND EXISTS (...)  -- Same admin check as Policy 2    │
│ )                                                       │
│                                                         │
│ Result:                                                 │
│ Admin:                                                  │
│   ✓ Can delete kyc-documents/111.../id_card.pdf        │
│   ✓ Can delete kyc-documents/222.../id_card.pdf        │
│                                                         │
│ Regular User:                                           │
│   ✗ Cannot delete ANY file (not admin)                │
│                                                         │
└──────────────────────────────────────────────────────────┘
```

---

## État de Production

```
✅ IMPLEMENTED:
├─ KYC document upload (Supabase Storage)
├─ Metadata in PostgreSQL database
├─ Status workflow (PENDING → APPROVED/REJECTED)
├─ Admin review interface
├─ RLS security policies
└─ Audit logging

⏳ PLANNED (À implémenter):
├─ Profile photo upload
├─ Avatar profile images
├─ Enhanced image optimization
├─ Bulk document processing
├─ Advanced anti-fraud detection
└─ OCR for document scanning
```

---

**Version:** 1.0  
**Dernière mise à jour:** 12 décembre 2024  
**Statut:** ✅ En production pour KYC
