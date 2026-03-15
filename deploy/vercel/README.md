# Vercel deployment structure

This folder centralizes Vercel deployment assets for the monorepo.

## Folder map

- `deploy/vercel/client.env.example`: env template for `apps/client`
- `deploy/vercel/admin.env.example`: env template for `apps/admin`
- `scripts/vercel/deploy-client.sh`: deploy client app to Vercel
- `scripts/vercel/deploy-admin.sh`: deploy admin app to Vercel

## Recommended project setup

Create two Vercel projects from this single repository:

1. `apps/client`
2. `apps/admin`

Each project should use:

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`

## Quick usage

From repository root:

```bash
npm run vercel:client
npm run vercel:admin
```

For first-time setup, run once per app:

```bash
cd apps/client && npx vercel
cd ../admin && npx vercel
```

Then production deployments can use the scripts above.
