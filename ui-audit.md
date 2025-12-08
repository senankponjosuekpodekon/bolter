# Audit visuel et inventaire UI — bolter (client + admin)

Date : 2025-11-23

## Objectif

Inventorier l'UI existante (apps/client + apps/admin), analyser la responsivité actuelle, l'accessibilité et identifier priorités pour la refonte mobile‑first.

## Méthodologie

- Parcours des fichiers source UI (composants, pages, layout)
- Vérification brief des conventions Tailwind et tokens
- Analyse rapide des patterns réactifs et des manques a11y

## Résumé global

- Client : React + Tailwind. Structure claire (Layout, pages : Login, Register, Dashboard, Accounts, Transactions, Loans, KYC, Profile). Tailwind est configuré mais `theme.extend` vide — pas de tokens centralisés.
- Admin : React-admin + MUI. Composants de CRUD (users, accounts, transactions, loans) préexistants ; réactivité gérée par react-admin / MUI mais design system séparé du client.
- Performance : build initial volumineux mais optimisation manuelle (vite manualChunks) déjà appliquée pour admin.

## Inventaire rapide (fichiers & composants clés)

Client (apps/client/src)

- Layout: `components/Layout.tsx` — header top, nav links visible `sm:flex`, pas de menu mobile.
- Notifications: `components/Notifications.tsx`, `components/NotificationBell.tsx` (some aria present)
- Pages principales : `pages/Dashboard.tsx`, `pages/Login.tsx`, `pages/Register.tsx`, `pages/Accounts.tsx`, `pages/Transactions.tsx`, `pages/Loans.tsx`, `pages/KYC.tsx`, `pages/Profile.tsx`
- Composants loans : `components/loans/LoanSummaryCard.tsx`, `LoanStatusBadge.tsx`, `LoanDetailsPanel.tsx`
- Style entry : `src/index.css` (Tailwind base only), `tailwind.config.js` exists but minimal.

Admin (apps/admin/src)

- Layout: `layout/AdminLayout.tsx`, app bar, menu.
- Resources: `resources/users.tsx`, `accounts.tsx`, `transactions.tsx`, `kycDocuments.tsx`, `loans.tsx`, `auditLogs.tsx`
- Notification system + websockets in `layout/components/NotificationsProvider.tsx` and services.
- Types and providers in `authProvider.ts` and `dataProvider.ts`.

## Accessibility quick scan (client)

- `NotificationBell` has aria labels & roles. Good.
- Forms (Login/Register) do NOT include `role=alert` for error messages, and inputs lack `aria-invalid` and `aria-describedby` for inline errors.
- No evidence of `skip to content` link, nor of keyboard focus traps (e.g., for modals/drawers) in current code.

## Responsiveness quick scan (client)

- Header: navigation links hidden under `sm:` / `md:` but **no burger / drawer** for small screens — the user has no access to many links on XS sizes (unless reflow reveals links elsewhere).
- Dashboard uses `grid grid-cols-1 md:grid-cols-3` — good start mobile → desktop, but gap/spacing may be tight on smallest screens.
- Login/Register use a centered layout with `max-w-md` — mobile friendly.

## Design system / tokens

- `apps/client/tailwind.config.js` exists with empty `extend` — no tokens defined. We should centralize color tokens, spacing, typographic scale and components.
- Admin uses MUI with its own theme file (`apps/admin/src/theme.ts`) — duplication of styles across apps; recommend a shared tokens file or careful mapping between Tailwind tokens and MUI theme.

## Security & workflows

- Transaction validation and KYC flows are implemented in both client and admin; sensible to enforce steppers, clear confirmations and strong visual feedback to reduce user error.

## Priority issues (high → low)

1. Navigation mobile missing — critical for mobile-first refonte. Implement hamburger + Drawer + optionally bottom nav for client.
2. Centralized design tokens absent — high: add tokens in Tailwind config and a shared `tokens.ts` for admin mapping.
3. Forms accessibility — high: add `aria-invalid`, `aria-describedby`, `role=alert` and visible focus styles & keyboard flows.
4. Skeletons / loading states missing on Dashboard & lists — medium: add to improve perceived performance.
5. Touch target sizes — medium: ensure buttons reach 44–48 px minimum on mobile.
6. Admin design divergence (Tailwind vs MUI) — low/medium: decide if unify tokens or continue separate but mapped systems.

## Quick wins (implement in sprint 1)

- Add mobile drawer/hamburger to `apps/client/src/components/Layout.tsx` and a bottom navigation bar component for mobile.
- Add accessible error container to login/register (`role=alert` + `aria-live="polite"`) and set `aria-invalid` on invalid inputs.
- Add simple skeleton placeholders to `Dashboard` while `useQuery` is loading.
- Define basic Tailwind tokens in `apps/client/tailwind.config.js` (primary, success, warning, spacing, font scale).

## Next steps (deliverables)

1. Create a detailed `ui-theme` (tokens) and implement them in `apps/client` (and map to admin MUI theme).
2. Implement navigation components (Drawer + BottomNav) and update `Layout.tsx`.
3. Add Dashboard refactor (BalanceCard, QuickActions, skeletons).
4. Accessibility pass for critical forms and interactive components.

## Livrable d’audit

- Fichier ajouté : `ui-audit.md` (ce document)
- Je peux maintenant démarrer l'étape 2 (création des tokens design) si tu confirmes.

Fin de l'audit
