FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
RUN npm install --workspace=server

COPY apps/server ./apps/server
RUN npm run build --workspace=server

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/server/package*.json ./apps/server/
COPY --from=builder /app/package*.json ./
RUN npm install --workspace=server --omit=dev

COPY --from=builder /app/apps/server/dist ./apps/server/dist

EXPOSE 3000

CMD ["node", "apps/server/dist/main"]
