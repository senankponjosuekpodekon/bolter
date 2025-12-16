# Système de Tontine (ROSCA) — Description complète

## Objectif

Mettre à disposition des utilisateurs un mécanisme de tontine (ROSCA) : création, gestion des membres, cycles, contributions, distributions, suivi et contrôle d’accès.

## Vue d’ensemble

- **Backend** : NestJS, Supabase (PostgreSQL + RLS), client admin Supabase pour contourner RLS et appliquer notre propre logique d’autorisations applicatives.
- **Frontend** : React (Vite). Pages principales : liste (`/tontines`), création (`/tontines/new`), détail (`/tontines/:id`), membres (`/tontines/:id/members`).
- **Auth** : JWT; le contrôleur utilise `req.user.id`. Les accès côté données sont contrôlés par le service via des vérifications créateur/membre.
- **Migrations DB** : `0009_create_tontines_tables.sql` (schéma + RLS), `0010_fix_tontines_fk.sql` (FK creator_id -> `public.users`), `0011_fix_remaining_tontine_user_fks.sql` (FK user_id/recipient_id -> `public.users`).

## Schéma de données (tables principales)

- `tontines`
  - `id` (uuid), `creator_id` (FK `public.users`), `name`, `description`
  - Paramètres financiers : `contribution_amount`, `currency`, `frequency`, `total_cycles`, `cycle_duration_days`
  - Distribution : `distribution_method`, `distribution_order[]`
  - Statut : `status` (enum, défaut `PENDING`), `current_cycle`, timestamps (`created_at`, `updated_at`, `started_at`, `completed_at`)
  - Règles : `late_payment_penalty_percent`, `withdrawal_allowed`, `withdrawal_penalty_percent`
  - `metadata` (jsonb)
- `tontine_members`
  - `id`, `tontine_id` (FK), `user_id` (FK `public.users`), `status`
  - Distribution : `distribution_order`, `distribution_date`, `has_received_distribution`
  - Suivi : `total_contributed`, `total_expected`
  - Contact : `phone_number`, `email_notification`, `sms_notification`
  - Timestamps
- `tontine_cycles`
  - `id`, `tontine_id`, `cycle_number`, `start_date`, `end_date`, `distribution_date`
  - `recipient_id` (FK `public.users`), `total_amount`, `status`, timestamps
- `tontine_contributions`
  - `id`, `tontine_id`, `member_id` (FK `tontine_members`), `cycle_id`
  - `amount`, `currency`, `status`, `paid_at`
  - Paiement : `payment_method`, `payment_reference`, pénalités (`is_late`, `late_payment_penalty`)
  - Timestamps
- `tontine_distributions`
  - `id`, `tontine_id`, `cycle_id`, `recipient_id`
  - `total_amount`, `currency`, `member_count`, `contributions_collected`, `penalties_collected`
  - `status`, `processed_at`, `payout_method`, `payout_reference`, timestamps
- `tontine_audit_logs`
  - Suivi des actions : `action`, `actor_id`, `resource_type`, `resource_id`, `changes`, `metadata`, timestamps

## Règles RLS (activées sur toutes les tables)

Définies dans 0009. Principes :

- `tontines` : SELECT si créateur ou membre; INSERT autorisé pour créateur (= auth.uid()); UPDATE par créateur.
- `tontine_members` : SELECT si user_id = auth.uid() ou créateur de la tontine; INSERT par créateur de la tontine.
- `tontine_cycles` : SELECT si créateur ou membre.
- `tontine_contributions` : SELECT si membre concerné ou créateur.
- `tontine_distributions` : SELECT si destinataire ou créateur.
- `tontine_audit_logs` : SELECT si créateur de la tontine.

> Le service utilise le **client admin Supabase** pour contourner RLS et applique sa propre logique d’autorisations (créateur/membre). Cela évite les 404 liés à RLS lorsque `auth.uid()` n’est pas renseigné côté Supabase.

## Flux fonctionnels

1. **Création d’une tontine** (`POST /tontines`)
   - Validations : `total_cycles >= 1`, `contribution_amount > 0`.
   - Enregistrement dans `tontines` avec `creator_id = userId`.
   - Statut initial: `PENDING` (création inactive par défaut).
   - Option: `initial_members[]` (facultatif) pour pré‑ajouter des membres lors de la création.
   - Audit : `tontine.created`.

2. **Liste des tontines de l’utilisateur** (`GET /tontines`)
   - Jointure logique : créateur OU membre.
   - Tri par `created_at` décroissant.

3. **Détail d’une tontine** (`GET /tontines/:id`)
   - Lecture `tontines`.
   - Vérification d’accès : créateur ou membre (sinon 403).

4. **Membres**
   - **Lister** (`GET /tontines/:id/members`) : nécessite être créateur ou membre.
   - **Ajouter** (`POST /tontines/:id/members`) : réservé au créateur ; permis uniquement quand `status = PENDING`; rejet si déjà membre ; calcule `total_expected` (= contribution_amount × total_cycles).
   - Audit : `tontine.member_added`.

5. **Démarrer la tontine** (`POST /tontines/:id/start`)
   - Vérifications : créateur, statut non `ACTIVE`, au moins 2 membres.
   - Crée le cycle 1 (dates start/end, statut ACTIVE).
   - Génère les contributions `PENDING` pour chaque membre.
   - Met à jour la tontine : statut ACTIVE, `current_cycle = 1`, `started_at`.
   - Audit : `tontine.started`.

6. **Partage et candidatures (optionnel)**

- Lien de partage public: le créateur peut communiquer un lien pour que des utilisateurs postulent.
- Mécanique proposée (à implémenter):
  - `POST /tontines/:id/invitations` → génère un code/lien d’invitation.
  - `POST /tontines/:id/apply` → crée une demande d’adhésion (état `PENDING_APPROVAL`).
  - `POST /tontines/:id/applications/:appId/approve|reject` → le créateur accepte/refuse.
- Règle: les candidatures ne sont possibles que tant que la tontine est `PENDING`.

## Lien de partage — UI/états (proposition)

Le lien de partage ouvre une page publique d’invitation (pas besoin d’être déjà membre) qui présente la tontine et permet de postuler tant qu’elle est `PENDING`.

- Contenu affiché:
  - Titre de la tontine, description courte.
  - Détails clés: montant et devise, fréquence, nombre total de cycles, méthode de distribution (avec résumé), règles (pénalités, retraits autorisés).
  - Statut: badge `PENDING` (ou message si non éligible à la candidature).
  - Optionnel: capacité/slots (ex: objectif de membres vs membres actuels, si renseigné).
  - Créateur: affichage minimal (pseudonyme/masqué) pour préserver la confidentialité.
  - CTA principal: “Postuler pour rejoindre”.

- Actions:
  - Bouton “Postuler” → ouvre un petit formulaire (ou redirige vers login si nécessaire):
    - Si connecté: envoie `POST /tontines/:id/apply` (ou `/apply/:code` via un code d’invitation).
    - Si non connecté: invite à créer un compte/se connecter, puis reprend le flux de candidature.
  - Bouton “Copier le lien” (facultatif) pour repartager l’invitation.

- États possibles:
  - Ouvert (PENDING): formulaire de candidature actif.
  - Fermé (ACTIVE/COMPLETED/CANCELLED): message “Candidature fermée” et CTA désactivé.
  - Déjà membre: affiche un message “Vous faites déjà partie de cette tontine” + lien vers la page de détails (si autorisé).
  - Lien invalide ou expiré: écran d’erreur dédié avec retour vers l’accueil.
  - Capacité atteinte (si définie): message spécifique (liste d’attente optionnelle).

- Sécurité & confidentialité:
  - Préférer un lien basé sur un code/jeton (`/invite/:code`) plutôt que l’ID public.
  - Le code peut expirer ou être révoqué par le créateur.
  - Les détails sensibles (liste des membres, historique) ne sont pas exposés sur la page publique.

- Notifications:
  - À chaque `apply`, le créateur reçoit une notification (socket + audit log) et peut approuver/refuser.
  - Le candidat reçoit une confirmation et, en cas d’acceptation, un message d’accueil.

- i18n:
  - Tous les textes passent par l’i18n existant (en-US/fr-FR), avec fallback.

6. **Enregistrer une contribution** (`POST /tontines/:id/contributions`)
   - Vérifications : créateur uniquement.
   - Récupère la contribution (member_id + cycle_id), sinon 404.
   - Met à jour : montant, statut PAID, `paid_at`, références paiement.
   - Met à jour le membre : `total_contributed += amount`.
   - Audit : `tontine.contribution_recorded`.

7. **Statistiques**
   - **Tontine** (`GET /tontines/:id/statistics`) : synthèse membres (total/actifs), contributions (expected, collected, taux), statut/cycle courant.
   - **Membre** (`GET /tontines/:id/members/:memberId/statistics`) : total versé/attendu, taux, participations, pending/late, distribution reçue.

## Méthodes de distribution

Quatre stratégies sont prises en charge via `distribution_method`.

- **MANUAL_ORDER**: ordre manuel défini par le créateur.
  - Principe: chaque membre reçoit la cagnotte selon son `distribution_order` (1, 2, 3, …).
  - Mise en place: lors de l’ajout du membre, le champ `distribution_order` peut être renseigné; à défaut, l’ordre peut être ajusté plus tard.
  - Calcul de tours: au démarrage, le cycle 1 cible l’ordre 1; à chaque nouveau cycle, l’ordre augmente de 1. Une fois l’ordre maximal atteint, on boucle au début.

- **RANDOM**: ordre aléatoire fixé au démarrage.
  - Principe: on génère une permutation aléatoire des membres au moment de `start` et on l’enregistre (dans `distribution_order` ou `distribution_order[]` de la tontine).
  - Reproductibilité: l’ordre peut être stocké dans `tontines.distribution_order[]` pour garder la trace et éviter des réassignations.
  - Calcul de tours: le cycle n cible le n-ième élément de la permutation.

- **SENIORITY**: priorité à l’ancienneté (date de `joined_at`).
  - Principe: les membres sont triés par `joined_at` croissant; les plus anciens reçoivent avant les plus récents.
  - Gestion des nouveaux: les nouveaux membres entrants après démarrage sont placés en fin de file sauf rééquilibrage explicite.
  - Calcul de tours: le cycle n cible le n-ième membre du tri par ancienneté.

- **LOTTERY**: tirage au sort à chaque cycle.
  - Principe: à chaque cycle actif, on tire aléatoirement un destinataire parmi les membres admissibles n’ayant pas encore reçu.
  - Empêche la répétition: on marque `has_received_distribution = true` sur le membre sélectionné; la loterie exclut ceux déjà servis.
  - Fin de boucle: lorsque tous ont reçu une fois, on réinitialise `has_received_distribution` (ou démarre une nouvelle série/cycle long) et on recommence.

### Détails d’implémentation (côté service)

- Au démarrage (`startTontine`):
  - On crée le cycle 1 et génère les contributions `PENDING` pour tous les membres.
  - On détermine le destinataire du cycle selon la méthode:
    - MANUAL_ORDER: membre avec `distribution_order = 1`.
    - RANDOM: premier membre de la permutation stockée.
    - SENIORITY: membre avec `joined_at` le plus ancien.
    - LOTTERY: tirage parmi membres `has_received_distribution = false`.
  - Le destinataire est enregistré dans `tontine_cycles.recipient_id` et, le cas échéant, on met à jour `tontine_members.has_received_distribution`.
- À chaque nouveau cycle (fonction à implémenter `nextCycle`):
  - On clôture le cycle courant (statut `COMPLETED`), calcule les totaux, puis crée le cycle suivant.
  - On sélectionne le destinataire selon la méthode:
    - MANUAL_ORDER: `distribution_order = current_cycle + 1` (boucle si dépassement).
    - RANDOM: n-ième élément de la permutation.
    - SENIORITY: n-ième du tri par `joined_at`.
    - LOTTERY: nouveau tirage parmi ceux non servis.
  - On regénère les contributions `PENDING` pour ce cycle.

### Cas particuliers et recommandations

- Changements d’ordre (MANUAL_ORDER): mettre à jour `tontine_members.distribution_order` avant le prochain cycle pour qu’il soit pris en compte.
- Ajout/retrait de membres en cours: recalculer l’ordre (MANUAL/RANDOM/SENIORITY) ou les éligibles (LOTTERY) pour éviter les incohérences.
- Transparence: stocker l’ordre global dans `tontines.distribution_order[]` pour audit et traçabilité (RANDOM/SENIORITY) et consigner dans `tontine_audit_logs`.

## Frontend (parcours utilisateur)

- **Liste** : `/tontines` — affiche les tontines où l’utilisateur est créateur/membre ; états loading/erreur/empty.
- **Création** : `/tontines/new` — formulaire; erreurs avec guidage (FK manquante, migrations, etc.).
- **Détail** : `/tontines/:id` — infos, actions (start), lien vers membres, gestion des erreurs (404, migrations non appliquées, etc.).
- **Membres** : `/tontines/:id/members` — liste, ajout de membre (user_id, distribution_order facultatif), états loading/erreur.

## Points techniques clés

- **Client Supabase** : `SupabaseService` expose `getClient()` et `getAdminClient()` (service key). Le module tontine utilise l’admin pour lecture/écriture, puis applique des contrôles d’accès applicatifs.
- **Auth backend** : `JwtAuthGuard` + `req.user.id`. Le contrôleur rejette si `userId` absent.
- **Politiques RLS** : présentes mais contournées par le client admin pour éviter les 404 quand `auth.uid()` n’est pas défini.
- **FK utilisateurs** : toutes les références pointent vers `public.users(id)` (migrations 0010 et 0011).

## Migrations à appliquer (ordre)

1. `apps/server/migrations/0009_create_tontines_tables.sql`
2. `apps/server/migrations/0010_fix_tontines_fk.sql`
3. `apps/server/migrations/0011_fix_remaining_tontine_user_fks.sql`
4. `apps/server/migrations/0012_set_tontine_pending_default.sql`

> Une version combinée existe dans `APPLY_THIS.sql` (0009 + 0010) ; exécuter ensuite 0011.

## Tests

- Backend unitaires (Nest) dans `apps/server/src/tontines/tontines.service.spec.ts` : validations, erreurs supabase, accès, addMember, startTontine, recordContribution, statistiques tontine et membre.
- Commande :

```bash
cd apps/server
npx jest src/tontines/tontines.service.spec.ts --config ../../jest.config.root.js --runInBand
```

## À surveiller / pistes d’amélioration

- WebSocket warnings `ws://localhost:3000/socket.io` (non bloquant pour REST) : démarrer le serveur socket ou désactiver côté client si inutile.
- Ajouter des tests d’intégration (API) et des tests frontend.
- Envisager l’usage d’un JWT signé côté backend pour Supabase si l’on veut exploiter RLS sans client admin.
