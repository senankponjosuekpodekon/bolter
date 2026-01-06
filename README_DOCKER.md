# Docker Setup

This project includes Docker support for development and production deployments.

## Quick Start

### Development with Docker Compose

```bash
# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Services

The `docker-compose.yml` includes:

- **postgres**: PostgreSQL 15 database
- **redis**: Redis cache (for sessions, queues)
- **server**: NestJS backend API (port 3000)
- **client**: React frontend (port 5173)
- **admin**: React Admin dashboard (port 5174)

## Environment Variables

Configure these in your `.env` file:

```env
# Database
POSTGRES_DB=bolter
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email (optional)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_USER=apikey
EMAIL_PASSWORD=your-smtp-password
```

## Building Individual Images

```bash
# Backend
docker build -f apps/server/Dockerfile -t bolter-server .

# Client
docker build -f apps/client/Dockerfile -t bolter-client .

# Admin
docker build -f apps/admin/Dockerfile -t bolter-admin .
```

## Production Deployment

For production, update `docker-compose.yml`:

1. Use proper secrets management (Docker Secrets, Vault)
2. Enable HTTPS with proper certificates
3. Use production-ready PostgreSQL (managed service recommended)
4. Add monitoring (Prometheus, Grafana)
5. Configure backups

## Health Checks

All services include health checks:

- **Server**: `http://localhost:3000/health`
- **Client**: `http://localhost:5173/health`
- **Admin**: `http://localhost:5174/health`
- **Postgres**: `pg_isready`
- **Redis**: `redis-cli ping`

## Troubleshooting

### Port conflicts
If ports are already in use, modify `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Change left side only
```

### Permission issues
Ensure Docker has access to your project directory.

### Build failures
Clear Docker cache:

```bash
docker-compose build --no-cache
```

## Performance Tips

- Use Docker volumes for development to enable hot-reload
- Use multi-stage builds (already implemented) for smaller images
- Enable BuildKit for faster builds: `export DOCKER_BUILDKIT=1`
