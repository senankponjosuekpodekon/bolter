# 🎯 Infographie - Système de Gestion des Fichiers

## Vue Globale du Système

```
┌──────────────────────────────────────────────────────────────────┐
│                     UTILISATEUR                                  │
│                  (App Web/Mobile)                                │
└───────────┬────────────────────────────────────────────────┬─────┘
            │                                                │
     UPLOAD │                                         VOIR STATUT
            │                                                │
            ▼                                                ▼
    ┌─────────────────┐                         ┌──────────────────┐
    │  KYC.tsx        │                         │  KYC Documents   │
    │  (Frontend)     │                         │  Liste de Statut │
    │                 │                         │                  │
    │ 📤 Upload File  │                         │ ✅ ID_CARD       │
    │ 📋 Form Submit  │                         │ ⏳ SELFIE        │
    │ ✅ Validation   │                         │ ❌ PROOF_ADDRESS │
    └────────┬────────┘                         └──────────────────┘
             │                                        ▲
             │ POST /api/kyc/documents               │
             │ {documentType, filePath...}           │ GET /api/kyc/documents
             │                                        │ (polling toutes les 30s)
             ▼                                        │
    ┌────────────────────────────────┐              │
    │      NestJS Backend            │              │
    │                                 │              │
    │  KycController                  │              │
    │  ├─ uploadDocument()            │              │
    │  ├─ getUserDocuments() ─────────┼──────────────┘
    │  ├─ getPendingDocuments() ◄──┐  │
    │  └─ reviewDocument() ◄────┐  │  │
    │                           │  │  │
    │  KycService               │  │  │
    │  ├─ Validate input       │  │  │
    │  ├─ Insert in BD         │  │  │
    │  ├─ Update KYC status    │  │  │
    │  └─ Log audit trail      │  │  │
    └────────┬────────────────┬┘  │  │
             │                │   │  │
      Métadonnées            Admin Review
             │                │   │  │
             ▼                │   │  │
    ┌──────────────────────┐  │   │  │
    │  PostgreSQL (BD)     │  │   │  │
    │  ┌────────────────┐  │  │   │  │
    │  │ kyc_documents  │  │  │   │  │
    │  │ ├─ id          │  │  │   │  │
    │  │ ├─ user_id     │  │  │   │  │
    │  │ ├─ doc_type    │  │  │   │  │
    │  │ ├─ status      │  │  │   │  │
    │  │ ├─ file_path   │  │  │   │  │
    │  │ └─ ...         │  │  │   │  │
    │  └────────────────┘  │  │   │  │
    │  ┌────────────────┐  │  │   │  │
    │  │ users          │  │  │   │  │
    │  │ ├─ kyc_status ◄┼──┼──┼───┼──┴─ Admin updates
    │  │ └─ ...         │  │  │   │
    │  └────────────────┘  │  │   │
    └─────────┬────────────┘  │   │
              │                │   │
              │ Métadonnées    │   │
              │                │   │
              ▼                │   │
    ┌──────────────────────┐   │   │
    │  SUPABASE STORAGE    │   │   │
    │  (AWS S3)            │   │   │
    │                       │   │   │
    │  kyc-documents/      │   │   │
    │  └── {userId}/       │   │   │
    │      ├── id_card...  │   │   │
    │      ├── selfie...   │   │   │
    │      └── proof_addr..│   │   │
    │                       │   │   │
    │  🔒 AES-256 Encrypt   │   │   │
    │  🌐 Multi-Region      │   │   │
    │  📦 Auto Backup       │   │   │
    └───────────────────────┘   │   │
                                │   │
                ┌───────────────┴───┴───────────┐
                │                               │
                ▼                               ▼
        ┌─────────────────┐           ┌────────────────┐
        │   ADMIN PANEL   │           │  USER FEEDBACK │
        │                 │           │                │
        │ 📋 Review Docs  │           │ ✅ Approved!   │
        │ 🔍 View Details │           │ ❌ Rejected ❌  │
        │ ✅ Approve/❌   │           │ 📧 Notification│
        │ 💬 Add Comment  │           │                │
        └────────┬────────┘           └────────────────┘
                 │
                 │ PATCH /api/kyc/documents/{id}/review
                 │ {approved: true/false, reason}
                 │
                 ▼ (Updates BD & triggers notification)
```

---

## Cycle de Vie d'un Document

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIFECYCLE DIAGRAM                             │
└─────────────────────────────────────────────────────────────────┘

                    START
                      │
                      ▼
        ┌─────────────────────────┐
        │  User selects file      │
        │  (JPG, PNG, PDF < 5MB)  │
        └────────────┬────────────┘
                     │
                     ▼
        ┌──────────────────────────┐
        │  Frontend validates      │
        │  ✓ Size                  │
        │  ✓ Format                │
        │  ✓ Type (ID/Selfie/...)  │
        └────────────┬─────────────┘
                     │
          ┌──────────┴──────────┐
          │                     │
      Valid                  Invalid
          │                     │
          ▼                     ▼
    ┌──────────┐         ┌──────────┐
    │ Continue │         │ Show Err │
    │  (→POST) │         │  "Fix..." │
    └────┬─────┘         └──────────┘
         │
         ▼
    ┌───────────────────────────────┐
    │ POST /api/kyc/documents       │
    │ + JWT Token                   │
    └────────────┬──────────────────┘
                 │
                 ▼
    ┌─────────────────────────────┐
    │ KycService.uploadDocument() │
    │ ├─ Validate user exists ✓  │
    │ ├─ Validate document type ✓│
    │ ├─ Insert metadata in BD ✓ │
    │ └─ Log audit trail ✓       │
    └────────────┬────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ INSERT INTO kyc_documents    │
    │ status = 'PENDING'            │
    │ created_at = NOW()            │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ File stored in Supabase      │
    │ kyc-documents/{userId}/...    │
    │ (Encrypted AES-256)           │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ HTTP 201 Created             │
    │ Return document metadata      │
    │ status: 'PENDING'            │
    └────────────┬─────────────────┘
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Frontend shows:              │
    │ ⏳ PENDING (En attente)     │
    │                              │
    │ Start polling for updates    │
    │ (every 30 seconds)           │
    └────────────┬─────────────────┘
                 │
                 │ ⏳ Waiting for admin review...
                 │
                 │ (Can be minutes/hours)
                 │
                 ▼
    ┌──────────────────────────────┐
    │ Admin review (in admin panel)│
    │ 1. Opens document             │
    │ 2. Examines content           │
    │ 3. Makes decision:            │
    └────────────┬──────────────────┘
                 │
         ┌───────┴────────┐
         │                │
      Approve         Reject
         │                │
    ✅ YES             ❌ NO
         │                │
         ▼                ▼
    ┌─────────────┐  ┌────────────────┐
    │PATCH w/     │  │PATCH w/        │
    │approved:    │  │approved: false │
    │true         │  │reason: "Blurry"│
    │             │  │                │
    └────┬────────┘  └────────┬───────┘
         │                    │
         ▼                    ▼
    ┌─────────────────┐  ┌──────────────┐
    │UPDATE status=   │  │UPDATE status=│
    │'APPROVED'       │  │'REJECTED'    │
    │reviewed_at=now()│  │reason=...    │
    │reviewed_by=...  │  │reviewed_at...│
    └────┬────────────┘  └──────┬───────┘
         │                      │
         ▼                      ▼
    ┌──────────────────┐  ┌──────────────────┐
    │Recalculate       │  │Recalculate       │
    │user kyc_status   │  │user kyc_status   │
    │                  │  │                  │
    │Check: All docs   │  │Check: Any reject?│
    │approved?         │  │YES → kyc_status= │
    │YES → APPROVED    │  │'REJECTED'        │
    │NO → SUBMITTED    │  │                  │
    └────┬─────────────┘  └──────┬───────────┘
         │                       │
         ▼                       ▼
    ┌─────────────┐         ┌─────────────┐
    │ User blocked│         │User can     │
    │ ✅APPROVED  │         │re-upload❌ │
    │             │         │             │
    │Can transfer,│         │Show reason: │
    │withdraw,    │         │"Trop floue" │
    │invest!  🎉  │         │   👉 Retry  │
    │             │         │             │
    └─────────────┘         └─────────────┘
                 │                 │
                 │                 │ User re-uploads
                 │                 │ better photo
                 │                 │
                 │                 ▼
                 │            ┌──────────┐
                 │            │PENDING   │
                 │            │(again)   │
                 │            └────┬─────┘
                 │                 │
                 │                 │ Admin reviews again
                 │                 │
                 │                 ▼
                 │            ┌──────────┐
                 │            │APPROVED ✅│
                 │            └────┬─────┘
                 │                 │
                 └────────┬────────┘
                          │
                          ▼
               ┌──────────────────────┐
               │ User KYC Status      │
               │ = APPROVED 🎉        │
               │                      │
               │ All 3 docs done ✅   │
               │ ├─ ID Card ✅       │
               │ ├─ Selfie ✅        │
               │ └─ Proof ✅          │
               │                      │
               │ Features unlocked!   │
               └────────────┬─────────┘
                            │
                            ▼
                    ┌────────────────┐
                    │ User CAN:      │
                    │ • Transfer     │
                    │ • Withdraw     │
                    │ • Invest       │
                    │ • Get loans    │
                    └────────────────┘
```

---

## Comparaison des Statuts

```
┌──────────────────────────────────────────────────────────────┐
│              KYC DOCUMENT STATUS vs USER KYC STATUS           │
└──────────────────────────────────────────────────────────────┘

DOCUMENT STATUS                    USER KYC STATUS
(Per file)                         (Global)

┌──────────┐                       ┌──────────────┐
│ PENDING  │ ← En attente          │ PENDING      │
│ ⏳       │   révision            │ 🔴 Documents │
│          │                       │    manquants │
└──────────┘                       │    ou pas    │
                                   │    commencé  │
             ┌───────────┐         └──────────────┘
             │ One doc is│
             │ PENDING,  │
             │ others: ✓ │         ┌──────────────┐
             └─────┬─────┘         │ SUBMITTED    │
                   │               │ 🟡 Tous les  │
                   └──────────────→│    docs sont │
                                   │    uploadés  │
                                   │    révision  │
┌──────────┐                       │    en cours  │
│ APPROVED │ ← Approuvé            └──────────────┘
│ ✅       │   Valide
│          │                       ┌──────────────┐
└──────────┘                       │ APPROVED     │
             ┌───────────┐         │ 🟢 Tous les  │
             │ All docs  │         │    docs sont │
             │ APPROVED  │         │    approuvés │
             │ ✓✓✓       │         │    Débloquer │
             └─────┬─────┘         │    features  │
                   │               └──────────────┘
                   └──────────────→

┌──────────┐                       ┌──────────────┐
│ REJECTED │ ← Rejeté (motif)      │ REJECTED     │
│ ❌       │   Renvoyer            │ 🔴 Min. 1    │
│          │   meilleur fichier    │    doc rejet │
└──────────┘                       │    → renvoyer│
                                   └──────────────┘
```

---

## Architecture Composants

```
Frontend (React)
├── KYC.tsx
│   ├── DocumentUploadCard (3x)
│   │   ├─ File Input
│   │   ├─ Progress Bar
│   │   └─ Status Badge
│   │       ├─ ✅ APPROVED (green)
│   │       ├─ ⏳ PENDING (yellow)
│   │       └─ ❌ REJECTED (red)
│   │
│   ├── DocumentHistory Table
│   │   ├─ Document Type
│   │   ├─ Status
│   │   ├─ Upload Date
│   │   └─ Review Date
│   │
│   └─ React Query Integration
│       ├─ useQuery: Get documents
│       ├─ useMutation: Upload doc
│       └─ Polling: Every 30s

Backend (NestJS)
├── KycController
│   ├─ POST /documents (upload)
│   ├─ GET /documents (user docs)
│   ├─ GET /documents/pending (admin)
│   └─ PATCH /documents/{id}/review
│
├── KycService
│   ├─ uploadDocument()
│   ├─ findByUserId()
│   ├─ findPendingDocuments()
│   ├─ reviewDocument()
│   └─ updateUserKycStatus()
│
└── Guards & Decorators
    ├─ JwtAuthGuard (auth required)
    ├─ RolesGuard (admin checks)
    └─ @Roles('admin', 'compliance')

Database (Supabase PostgreSQL)
├── kyc_documents table
│   ├─ Primary Key: id
│   ├─ Foreign Key: user_id → users
│   ├─ Status field (PENDING/APPROVED/REJECTED)
│   └─ Audit fields (created_at, reviewed_by, ...)
│
└── users table
    └─ kyc_status field (PENDING/SUBMITTED/APPROVED/REJECTED)

Storage (Supabase S3)
└── kyc-documents bucket
    ├─ RLS Policies
    │   ├─ Users read own files
    │   ├─ Users upload to own folder
    │   ├─ Admins read all
    │   └─ Admins can delete
    │
    └─ File Structure
        └── {userId}/
            ├── id_card_*.pdf
            ├── selfie_*.jpg
            └── proof_address_*.png
```

---

## Statistiques & Monitoring

```
┌─ MONITORING DASHBOARD ─────────────────────────────┐
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Document Upload Status                       │ │
│  ├──────────────────────────────────────────────┤ │
│  │ ✅ APPROVED:    234 docs (45%)              │ │
│  │ ⏳ PENDING:     156 docs (30%)              │ │
│  │ ❌ REJECTED:    105 docs (20%)              │ │
│  │ 🟦 IN_PROGRESS: 25 docs (5%)               │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Storage Usage                                │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Used:  245 MB / 1000 MB (24.5%)            │ │
│  │ Files: 1,342 documents                      │ │
│  │ Users: 456 with KYC                         │ │
│  │ Avg Size: 182 KB per file                   │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ User KYC Status Distribution                │ │
│  ├──────────────────────────────────────────────┤ │
│  │ 🟢 APPROVED:  234 users (51%)              │ │
│  │ 🟡 SUBMITTED: 156 users (34%)              │ │
│  │ 🔴 REJECTED:  45 users (10%)               │ │
│  │ ⚪ PENDING:   15 users (3%)                │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
│  ┌──────────────────────────────────────────────┐ │
│  │ Review Performance                          │ │
│  ├──────────────────────────────────────────────┤ │
│  │ Avg Review Time: 2.3 hours                  │ │
│  │ Success Rate: 69%                           │ │
│  │ Re-upload Rate: 31%                         │ │
│  │ Pending > 48h: 12 documents                 │ │
│  └──────────────────────────────────────────────┘ │
│                                                   │
└───────────────────────────────────────────────────┘
```

---

## Checklist Implémentation

```
✅ IMPLEMENTED
├─ Document upload endpoint
├─ Metadata database storage
├─ File storage in Supabase
├─ Status workflow
├─ Admin review endpoint
├─ RLS security policies
├─ Audit logging
├─ Frontend upload UI
├─ Frontend status display
├─ User KYC status calculation
├─ Document validation
└─ JWT authentication

⏳ PLANNED
├─ Profile photo upload
├─ Avatar image storage
├─ Image optimization
├─ Thumbnail generation
├─ OCR document scanning
├─ Anti-fraud detection
├─ Bulk document processing
├─ Document expiry reminder
├─ SMS/Email notifications
└─ Advanced analytics
```

---

**Version:** 1.0  
**Créé:** 12 décembre 2024  
**Statut:** ✅ Production Ready (KYC Documents)
