FROM node:20-alpine AS builder
WORKDIR /app

# All workspace manifests are needed so npm ci can resolve the lockfile
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY apps/client/package*.json ./apps/client/
RUN npm ci --workspace=server --include-workspace-root=false

COPY apps/server ./apps/server
RUN npm run build --workspace=server

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/apps/client/package*.json ./apps/client/
RUN npm ci --workspace=server --omit=dev --include-workspace-root=false

COPY --from=builder /app/apps/server/dist ./apps/server/dist

USER node

EXPOSE 3000

CMD ["node", "apps/server/dist/main"]
