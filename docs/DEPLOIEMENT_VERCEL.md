# Deploiement sur Vercel (Monorepo)

## Organisation recommandee des dossiers

Les fichiers lies a Vercel sont regroupes ici:

- `deploy/vercel/README.md`
- `deploy/vercel/client.env.example`
- `deploy/vercel/admin.env.example`
- `scripts/vercel/deploy-client.sh`
- `scripts/vercel/deploy-admin.sh`

Commandes depuis la racine du repo:

```bash
npm run vercel:client
npm run vercel:admin
```

Ce projet est un monorepo avec 3 applications:

- `apps/client` (React + Vite)
- `apps/admin` (React + Vite)
- `apps/server` (NestJS)

## Recommande en production

Deployer **2 projets Vercel** pour les frontends:

- Projet Vercel 1: `apps/client`
- Projet Vercel 2: `apps/admin`

Le backend `apps/server` n'est pas directement adapte a Vercel tel qu'il est aujourd'hui (serveur NestJS long-running, WebSockets). Il est recommande de l'heberger sur une plateforme Node server classique (Railway, Render, Fly.io, etc.) puis de pointer les frontends vers cette URL.

## 1) Preparer les variables d'environnement

Variables minimales pour `apps/client`:

- `VITE_API_URL` (ex: `https://api.mondomaine.com/api`)
- `VITE_API_BASE_URL` (optionnel, fallback utilise dans certains services WebSocket)
- `VITE_NOTIFICATIONS_URL` (optionnel, sinon `VITE_API_URL`)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Variables minimales pour `apps/admin`:

- `VITE_API_URL` (ex: `https://api.mondomaine.com/api`)
- `VITE_NOTIFICATIONS_URL` (optionnel, sinon `VITE_API_URL`)

## 2) Deployer via UI Vercel (simple)

Pour chaque app (`client` puis `admin`):

1. Ouvrir Vercel > `Add New...` > `Project`
2. Importer le repo `bolter`
3. Configurer `Root Directory`:
   - `apps/client` pour le projet client
   - `apps/admin` pour le projet admin
4. Verifier:
   - `Build Command`: `npm run build`
   - `Output Directory`: `dist`
5. Ajouter les variables d'environnement
6. Deploy

## 3) Deployer via CLI (rapide)

Installer et se connecter:

```bash
npm i -g vercel
vercel login
```

### Client

```bash
cd apps/client
vercel
vercel --prod
```

### Admin

```bash
cd ../admin
vercel
vercel --prod
```

## 4) Config de routing SPA

Chaque app contient un `vercel.json` qui ajoute une rewrite vers `index.html` pour que React Router fonctionne sur les routes profondes (refresh direct sur `/dashboard`, `/settings`, etc.).

- `apps/client/vercel.json`
- `apps/admin/vercel.json`

## 5) Checklist post-deploiement

- Ouvrir `https://<client-domain>` et tester login/navigation
- Ouvrir `https://<admin-domain>` et tester login admin
- Verifier les appels API (pas de CORS, pas de 404)
- Verifier les variables Vite dans Vercel (Preview + Production)

## Notes backend

Si tu veux absolument tout mettre sur Vercel, il faudra adapter `apps/server` au modele serverless (handlers API au lieu d'un serveur NestJS qui ecoute un port). C'est un chantier separe.
