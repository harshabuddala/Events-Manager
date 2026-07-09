# Dokploy Deployment Guide

## What Happens on Startup

The app handles everything automatically:

1. **Waits for PostgreSQL** to be ready
2. **Runs `prisma migrate deploy`** — applies all pending migrations
3. **Seeds the database** — only if the `users` table is empty
4. **Starts Next.js** server on port 8472
5. **Health check** hits `/api/health` every 30s

## Default Admin Credentials

| Field | Value |
|---|---|
| Email | `admin@edunura.com` |
| Password | `admin123` |

**Change this in production** by setting `ADMIN_PASSWORD` environment variable.

## Prerequisites

- Dokploy installed on your server (Docker Swarm mode)
- A domain pointed to your server's IP (A record)
- Git repository pushed to GitHub/GitLab

## Step 1: Generate Secrets

Run these on your server to generate secure values:

```bash
# Strong JWT secret
openssl rand -base64 32

# Strong PostgreSQL password
openssl rand -base64 24

# Strong admin password
openssl rand -base64 16
```

## Step 2: Create Project in Dokploy

1. Open Dokploy dashboard (`http://YOUR_SERVER_IP:3000`)
2. Click **Create Project** → name it `edunura`
3. Click **Create Service** → select **Compose**

## Step 3: Configure the Compose Service

1. Name the service `edunura-app`
2. Go to **General** → **Raw** tab
3. Paste the contents of `docker-compose.yml`
4. Click **Save**

## Step 4: Set Environment Variables

Go to **Environment** tab and add:

```
DATABASE_URL=postgresql://edunura:YOUR_PASSWORD@edunura-db:5432/edunura
JWT_SECRET=YOUR_JWT_SECRET
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_USER=edunura
POSTGRES_DB=edunura
NODE_ENV=production
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
APP_DOMAIN=edunura.yourdomain.com
```

## Step 5: Configure Domain

### Option A: Use Traefik Labels (already in docker-compose.yml)

Set `APP_DOMAIN` in environment variables to your domain.

### Option B: Use Dokploy Domain Tab

1. Go to **Domain** tab
2. Click **Add Domain**
3. Set:
   - Service Name: `edunura-app`
   - Host: `edunura.yourdomain.com`
   - Port: `8472`
   - HTTPS: Enable

## Step 6: Deploy

1. Go to **General** tab
2. Click **Deploy**
3. Monitor logs in **Deployments** tab

## Step 7: Verify Deployment

Check the health endpoint:

```bash
curl https://edunura.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-29T...",
  "checks": { "database": "ok", "prisma": "ok" },
  "uptime": 12.345
}
```

## First Login

1. Go to `https://edunura.yourdomain.com`
2. Login with:
   - Email: `admin@edunura.com`
   - Password: `admin123` (or your `ADMIN_PASSWORD`)
3. **Change the password immediately** in Settings → Users

## Troubleshooting

### Build fails
- Check that `DATABASE_URL` is set correctly
- Ensure PostgreSQL container is healthy before app starts

### App can't connect to database
- Verify `edunura-db` container is running
- Check the `DATABASE_URL` format: `postgresql://user:pass@edunura-db:5432/dbname`

### Health check fails
- App may need more startup time — increase `start_period` in healthcheck
- Check logs: `docker logs <container-id>`

### Migrations failed
- Check logs for migration errors
- Manually run: `docker exec -it <container-id> npx prisma migrate deploy`

### Database not seeded
- Check if `users` table has data
- Manually seed: `docker exec -it <container-id> npx prisma db seed`
