Très bien. Voici **le pack complet** demandé :

* Document UX/UI professionnel
* Architecture UX
* Wireframes textuels
* Design system
* JSON d’instructions détaillé pour ton agent IA (prêt à exécution)
* Roadmap d’implémentation complète

L’ensemble est entièrement cohérent avec ton projet actuel (TypeScript, Next.js/Nest style, Tailwind, workspaces client/admin, banque SaaS).

---

# 1. DOCUMENT UX/UI PROFESSIONNEL

## 1.1 Vision Produit

Le produit est une plateforme bancaire SaaS moderne, modulaire, mobile-first, permettant :

* Aux **utilisateurs** : de gérer leur argent, effectuer des transactions, voir l’historique, gérer un compte virtuel, demander des prêts.
* Aux **banques / prêteurs privés** : de gérer leurs clients, suivre les prêts, autoriser ou refuser des transactions, monitorer les activités.
* Aux **administrateurs** : de gérer le système global, superviser les transactions, gérer les institutions et les utilisateurs.

Le produit suit une approche **multicomptes**, avec une séparation stricte entre :

* `apps/client` : interface utilisateur standard
* `apps/admin` : interface banque / prêteur / super admin

---

# 1.2 Personas

### Persona 1 – Utilisateur Standard

Objectifs :

* Envoyer/recevoir de l’argent
* Consulter son solde
* Suivre ses transactions
* Demander un prêt (optionnel)
  Douleurs :
* Interfaces bancaires trop complexes
* Processus de validation trop longs

### Persona 2 – Banque / Prêteur

Objectifs :

* Gérer leurs clients
* Valider/Rejeter des transactions
* Gérer les prêts
* Suivre les liquidités/flux
  Douleurs :
* Manque de vue globale
* Manque de logs précis

### Persona 3 – Administrateur Global

Objectifs :

* Superviser l’ensemble du système
* Accéder à toutes les institutions
* Résoudre les anomalies
  Douleurs :
* Outils de monitoring limités
* Information dispersée

---

# 1.3 Parcours Utilisateurs – Client

### Parcours : Faire une transaction

1. Accès Dashboard → bouton “Nouvelle transaction”
2. Sélection type : transfert interne / externe
3. Formulaire → montant, destinataire
4. Vérifications (stepper)
5. Confirmation
6. Success screen + ID transaction

### Parcours : Demande de prêt

1. Dashboard → “Demander un prêt”
2. Choix du montant
3. Upload justificatifs
4. Envoi
5. Attente décision banque
6. Notification

---

# 1.4 Parcours Utilisateur – Admin Banque

1. Login
2. Dashboard institution
3. Liste des transactions en attente
4. Validation / Rejet
5. Gestion des clients
6. Gestion des prêts

---

# 1.5 Architecture Fonctionnelle

### Côté Client

* Auth
* Dashboard
* Transactions

  * Nouvelle transaction
  * Historique
* Prêts

  * Nouvelle demande
  * Historique
* Paramètres
* Notifications
* KYC

### Côté Admin

* Dashboard global
* Clients
* Transactions

  * En attente
  * Validées
  * Rejetées
* Prêts
* Institutions
* Configuration système
* Logs

---

# 2. ARCHITECTURE UX (NAVIGATION & STRUCTURE)

## 2.1 Architecture Client (Mobile & Desktop)

### Mobile (Bottom Navigation)

* Home
* Transactions
* Prêts
* Notifications
* Profil

### Desktop (Sidebar gauche)

* Solde
* Transactions
* Prêts
* Notifications
* Paramètres

---

## 2.2 Architecture Admin

Sidebar compacte :

* Dashboard
* Clients
* Transactions
* Prêts
* Institutions
* Logs
* Settings

---

# 3. WIREFRAMES TEXTUELS (CLAIRS POUR UN AGENT IA)

## 3.1 Dashboard Client (mobile-first)

```
-------------------------------------------------
| Solde actuel                                  |
| 45 200 XOF                                    |
-------------------------------------------------
| Actions rapides                                |
| [Nouvelle transaction] [Demande de prêt]      |
-------------------------------------------------
| Dernières transactions                         |
| • 12 000 XOF → Banque A                        |
| • 5 000 XOF ← Client B                         |
| • 1 200 XOF frais                              |
-------------------------------------------------
```

## 3.2 Stepper – Nouvelle transaction

```
STEP 1: Informations de base
- Montant
- Destinataire
[Suivant]

STEP 2: Vérification
- Récapitulatif
[Confirmer]

STEP 3: Résultat
- Transaction réussie
- ID: #TRX-92J73K
```

## 3.3 Admin Dashboard

```
-------------------------------------------------
| KPIs                                          |
| Transactions en attente: 19                   |
| Prêts en cours: 7                             |
| Nouveaux clients: 12                          |
-------------------------------------------------
| Transactions en attente                       |
| • #TRX-7741 – 10 000 XOF – Client X           |
| • #TRX-8812 – 400 000 XOF – Client Y          |
-------------------------------------------------
```

---

# 4. DESIGN SYSTEM (TAILWIND)

## 4.1 Couleurs

```
primary: #2563EB
primary-light: #3B82F6
primary-dark: #1E40AF
success: #16A34A
warning: #D97706
danger: #DC2626
gray-50 → gray-900
```

## 4.2 Typographie

```
Sans: Inter  
H1: text-3xl font-bold  
H2: text-2xl font-semibold  
Body: text-base  
Small: text-sm  
```

## 4.3 Composants

* Button (solid, outline, ghost)
* Card (shadow-md, rounded-xl)
* Drawer (mobile navigation)
* Stepper
* Modal
* Table (admin)
* Form Fields (base + states)

---

# 5. JSON POUR TON AGENT IA (PRÊT À ÊTRE UTILISÉ)

Voici le JSON que tu peux envoyer à ton agent IA immédiatement :

```json
{
  "version": "1.0.0",
  "project": "banking-platform",
  "workspaces": ["apps/client", "apps/admin"],

  "refonte": {
    "globalGoals": [
      "Refonte complète mobile-first",
      "Ajout d’un design system Tailwind",
      "Création de composants UI réutilisables",
      "Création navigation client mobile/desktop",
      "Refonte dashboard client/admin",
      "Implémentation stepper transaction",
      "Amélioration UX transactions/loans/KYC",
      "Ajout skeletons et loaders"
    ],

    "designSystem": {
      "createFiles": [
        {
          "path": "apps/client/src/styles/tokens.ts",
          "content": "/* colors, spacing, typography, shadows */"
        }
      ],
      "applyTailwindConfig": true
    },

    "clientApp": {
      "navigation": {
        "mobileDrawer": {
          "createFile": "apps/client/src/components/navigation/MobileDrawer.tsx",
          "specs": [
            "Menu hamburger",
            "Items: Dashboard, Transactions, Loans, Notifications, Profile"
          ]
        },
        "sidebar": {
          "createFile": "apps/client/src/components/navigation/Sidebar.tsx",
          "variant": "desktop"
        },
        "updateLayout": {
          "file": "apps/client/src/components/Layout.tsx",
          "actions": ["inject mobile drawer", "inject sidebar", "responsive logic"]
        }
      },

      "dashboard": {
        "updateFile": "apps/client/src/pages/Dashboard.tsx",
        "components": ["BalanceCard", "QuickActions", "RecentTransactions"],
        "addSkeletons": true
      },

      "transactions": {
        "createPages": [
          "apps/client/src/pages/transactions/NewTransaction.tsx",
          "apps/client/src/pages/transactions/TransactionSuccess.tsx"
        ],
        "createStepperComponent": true
      },

      "loans": {
        "addLoanRequestPage": true,
        "addLoanHistoryPage": true
      },

      "notifications": {
        "addNotificationCenter": true
      }
    },

    "adminApp": {
      "dashboard": {
        "updateFile": "apps/admin/src/pages/Dashboard.tsx",
        "components": ["KPICards", "PendingTransactionsTable"]
      },
      "transactions": {
        "createFilterableTable": true
      },
      "clients": {
        "createClientListPage": true,
        "createClientDetailsPage": true
      },
      "loans": {
        "createLoanManagementPages": true
      }
    }
  }
}
```

---

# 6. ROADMAP D’IMPLÉMENTATION

## Sprint 1 – Navigation & Layout

* Mobile Drawer
* Sidebar
* Refactor Layout client
* Responsive complet

## Sprint 2 – Dashboard Client

* BalanceCard
* QuickActions
* Skeletons

## Sprint 3 – Transactions

* Stepper
* Nouveau flow transaction
* Success screen

## Sprint 4 – Admin

* Dashboard redesign
* Transactions review table

## Sprint 5 – Prêts & KYC

* LoanRequest
* KYC flow + admin review

## Sprint 6 – Performance & A11y

* Skeletons
* Lazy loading
* A11y fixes

---

# Souhaites-tu que je génère maintenant :

1. Les **fichiers réels (code React/Tailwind)** pour la navigation ?
2. Les composants du **dashboard client** ?
3. Les pages **transactions** ?
4. Ou le **design system complet** (avec tokens Tailwind) ?


