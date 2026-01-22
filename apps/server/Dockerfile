# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

# Install dependencies (including devDependencies for build) with increased timeout
# Using npm install instead of npm ci for better network resilience
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install

# Copy server source code
COPY apps/server ./apps/server
COPY tsconfig.json ./

# Build the application
WORKDIR /app/apps/server
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/server/package*.json ./apps/server/

# Install production dependencies only with increased timeout
# Using npm install instead of npm ci for better network resilience
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 10 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm install --omit=dev

# Copy built application from builder
COPY --from=builder /app/apps/server/dist ./apps/server/dist
COPY --from=builder /app/apps/server/migrations ./apps/server/migrations

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})" || exit 1

# Start application
WORKDIR /app/apps/server
CMD ["node", "dist/main.js"]
