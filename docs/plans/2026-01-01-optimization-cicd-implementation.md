# Optimization & CI/CD Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Optimize bundle size, add caching, and enable Docker deployment while keeping GitHub Pages as primary.

**Architecture:** Hybrid deployment - GitHub Pages remains primary (free), Docker image built in parallel for self-hosted use. Bundle optimizations reduce initial load by ~30KB through removing unnecessary vendor chunks and adding pre-compression.

**Tech Stack:** Vite, vite-plugin-compression, Docker, nginx:alpine, Caddy, GitHub Actions, GHCR

---

## Task 1: Remove @dnd-kit from Vendor Chunks

**Files:**
- Modify: `vite.config.ts:30-39`

**Step 1: Remove dnd-vendor from manualChunks**

Edit `vite.config.ts` to remove the dnd-vendor entry:

```typescript
manualChunks: {
  // React core - changes rarely
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  // i18n - changes rarely
  'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
  // three.js - large, only used by ShapeArchitect (minified by plugin)
  'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
  // REMOVED: dnd-vendor - now bundles with ShapeArchitect chunk
},
```

**Step 2: Run build to verify**

```bash
npm run build
```

Expected: Build succeeds. `dnd-vendor-*.js` no longer appears in `dist/assets/`. The ShapeArchitect chunk size increases slightly (absorbs @dnd-kit).

**Step 3: Commit**

```bash
git add vite.config.ts
git commit -m "perf: remove @dnd-kit from vendor chunks

Bundles @dnd-kit with ShapeArchitect game chunk instead of separate
vendor chunk. Reduces HTTP requests for users who don't play ShapeArchitect."
```

---

## Task 2: Add Vite Compression Plugin

**Files:**
- Modify: `vite.config.ts:1-13`
- Modify: `package.json` (via npm install)

**Step 1: Install vite-plugin-compression**

```bash
npm install -D vite-plugin-compression
```

Expected: Package added to devDependencies in package.json.

**Step 2: Add compression plugin to vite.config.ts**

Add import at top of file:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { threeMinifier } from '@yushijinhun/three-minifier-rollup'
import viteCompression from 'vite-plugin-compression'
```

Add plugins after react():

```typescript
plugins: [
  // Three.js minifier - removes unused code from three.js bundle
  // Expected reduction: ~40-60% of three.js bundle size
  { ...threeMinifier(), enforce: 'pre' },
  react(),
  // Pre-compress assets for faster serving
  viteCompression({ algorithm: 'gzip' }),
  viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
],
```

**Step 3: Run build to verify compression**

```bash
npm run build
ls -la dist/assets/*.gz dist/assets/*.br 2>/dev/null | head -10
```

Expected: `.gz` and `.br` files appear alongside `.js` and `.css` files in `dist/assets/`.

**Step 4: Commit**

```bash
git add vite.config.ts package.json package-lock.json
git commit -m "perf: add gzip and brotli pre-compression

Assets are now pre-compressed at build time. Nginx/Caddy can serve
these directly without runtime CPU overhead."
```

---

## Task 3: Create deploy Directory Structure

**Files:**
- Create: `deploy/` directory

**Step 1: Create deploy directory**

```bash
mkdir -p deploy
```

**Step 2: Verify directory exists**

```bash
ls -la deploy/
```

Expected: Empty directory exists.

**Step 3: Commit**

```bash
git add deploy/.gitkeep 2>/dev/null || touch deploy/.gitkeep && git add deploy/.gitkeep
git commit -m "chore: add deploy directory for Docker configuration"
```

---

## Task 4: Create nginx.conf

**Files:**
- Create: `deploy/nginx.conf`

**Step 1: Create nginx configuration**

Create `deploy/nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    # Gzip for non-precompressed requests
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    # Serve pre-compressed files if available
    gzip_static on;

    # SPA fallback - serve index.html for all routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Immutable assets (content-hashed filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Static sounds
    location /sounds/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # HTML - no cache (entry point must always be fresh)
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Step 2: Verify file created**

```bash
cat deploy/nginx.conf | head -20
```

Expected: nginx configuration displayed.

**Step 3: Commit**

```bash
git add deploy/nginx.conf
git commit -m "feat(deploy): add nginx configuration with caching

- 1 year cache for hashed assets
- No cache for index.html
- Gzip and gzip_static enabled
- Security headers included"
```

---

## Task 5: Create Dockerfile for Local Builds

**Files:**
- Create: `deploy/Dockerfile`

**Step 1: Create multi-stage Dockerfile**

Create `deploy/Dockerfile`:

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Step 2: Verify file created**

```bash
cat deploy/Dockerfile
```

Expected: Dockerfile displayed.

**Step 3: Commit**

```bash
git add deploy/Dockerfile
git commit -m "feat(deploy): add multi-stage Dockerfile

- Stage 1: Build with Node 20
- Stage 2: Serve with nginx:alpine (~15MB image)
- Includes health check"
```

---

## Task 6: Create Dockerfile.ci for CI Builds

**Files:**
- Create: `deploy/Dockerfile.ci`

**Step 1: Create simplified CI Dockerfile**

Create `deploy/Dockerfile.ci` (uses pre-built dist from CI):

```dockerfile
FROM nginx:alpine

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built assets (built by CI, not Docker)
COPY dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**Step 2: Verify file created**

```bash
cat deploy/Dockerfile.ci
```

Expected: Simplified Dockerfile displayed.

**Step 3: Commit**

```bash
git add deploy/Dockerfile.ci
git commit -m "feat(deploy): add CI-optimized Dockerfile

Uses pre-built dist from GitHub Actions instead of building in Docker.
Faster CI builds, same result."
```

---

## Task 7: Create docker-compose.yml for Production

**Files:**
- Create: `deploy/docker-compose.yml`

**Step 1: Create production compose file**

Create `deploy/docker-compose.yml`:

```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - math-games
    networks:
      - web

  math-games:
    image: ghcr.io/${GITHUB_REPOSITORY:-local}/math-games:${TAG:-latest}
    restart: unless-stopped
    expose:
      - "80"
    networks:
      - web

volumes:
  caddy_data:
  caddy_config:

networks:
  web:
    driver: bridge
```

**Step 2: Verify file created**

```bash
cat deploy/docker-compose.yml
```

Expected: Compose file displayed.

**Step 3: Commit**

```bash
git add deploy/docker-compose.yml
git commit -m "feat(deploy): add production docker-compose

- Caddy for auto HTTPS via Let's Encrypt
- Pulls image from GHCR
- Configurable via GITHUB_REPOSITORY and TAG env vars"
```

---

## Task 8: Create docker-compose.dev.yml for Local Testing

**Files:**
- Create: `deploy/docker-compose.dev.yml`

**Step 1: Create dev compose file**

Create `deploy/docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  math-games:
    build:
      context: ..
      dockerfile: deploy/Dockerfile
    ports:
      - "3000:80"
    volumes:
      # Optional: mount dist for quick iteration without rebuild
      # - ../dist:/usr/share/nginx/html:ro
```

**Step 2: Verify file created**

```bash
cat deploy/docker-compose.dev.yml
```

Expected: Dev compose file displayed.

**Step 3: Commit**

```bash
git add deploy/docker-compose.dev.yml
git commit -m "feat(deploy): add dev docker-compose for local testing

Run: docker-compose -f deploy/docker-compose.dev.yml up --build
Access: http://localhost:3000"
```

---

## Task 9: Create Caddyfile

**Files:**
- Create: `deploy/Caddyfile`

**Step 1: Create Caddyfile**

Create `deploy/Caddyfile`:

```
{$DOMAIN:localhost} {
    reverse_proxy math-games:80

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        -Server
    }

    # Logging
    log {
        output stdout
        format console
    }
}
```

**Step 2: Verify file created**

```bash
cat deploy/Caddyfile
```

Expected: Caddyfile displayed.

**Step 3: Commit**

```bash
git add deploy/Caddyfile
git commit -m "feat(deploy): add Caddyfile for reverse proxy

- Auto HTTPS with Let's Encrypt
- Configurable domain via DOMAIN env var
- Security headers
- Console logging"
```

---

## Task 10: Test Docker Build Locally

**Files:**
- None (verification only)

**Step 1: Build and run locally**

```bash
cd "/Users/anhdao/vn stuff/math-games"
docker-compose -f deploy/docker-compose.dev.yml up --build -d
```

Expected: Container builds and starts.

**Step 2: Verify app is accessible**

```bash
curl -s http://localhost:3000 | head -20
```

Expected: HTML content with `<title>` containing app name.

**Step 3: Check container health**

```bash
docker-compose -f deploy/docker-compose.dev.yml ps
```

Expected: `math-games` container shows as `healthy` (may take 30s).

**Step 4: Stop container**

```bash
docker-compose -f deploy/docker-compose.dev.yml down
```

Expected: Container stopped and removed.

---

## Task 11: Update GitHub Actions Workflow

**Files:**
- Modify: `.github/workflows/deploy.yml`

**Step 1: Replace workflow with updated version**

Replace entire contents of `.github/workflows/deploy.yml`:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write
  packages: write

concurrency:
  group: "deploy"
  cancel-in-progress: true

jobs:
  # ─────────────────────────────────────────────────────────
  # Build job - shared by all deploy targets
  # ─────────────────────────────────────────────────────────
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test -- --run

      - name: Build
        run: npm run build

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload dist for Pages
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

      - name: Upload dist for Docker
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: ./dist
          retention-days: 1

  # ─────────────────────────────────────────────────────────
  # Deploy to GitHub Pages (primary)
  # ─────────────────────────────────────────────────────────
  deploy-pages:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

  # ─────────────────────────────────────────────────────────
  # Build and push Docker image (for self-hosted)
  # ─────────────────────────────────────────────────────────
  build-docker:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Download dist
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: ./dist

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}
          tags: |
            type=raw,value=latest,enable={{is_default_branch}}
            type=sha,prefix=

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./deploy/Dockerfile.ci
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Step 2: Verify workflow syntax**

```bash
cat .github/workflows/deploy.yml | head -30
```

Expected: Updated workflow displayed with new permissions and jobs.

**Step 3: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "feat(ci): add Docker image build to deploy workflow

- Builds Docker image in parallel with GitHub Pages deploy
- Pushes to GitHub Container Registry (ghcr.io)
- Tags with 'latest' and git SHA
- Uses build caching for faster subsequent builds"
```

---

## Task 12: Add Deployment Documentation

**Files:**
- Create: `docs/DEPLOYMENT.md`

**Step 1: Create deployment guide**

Create `docs/DEPLOYMENT.md`:

```markdown
# Deployment Guide

## GitHub Pages (Primary)

The app automatically deploys to GitHub Pages on every push to `main`.

**URL:** https://YOUR_USERNAME.github.io/math-games/

No configuration needed - this is the default deployment target.

---

## Self-Hosted (Docker)

For schools or organizations that need to host their own instance.

### Prerequisites

- Docker and Docker Compose installed
- Domain pointing to server IP (for HTTPS)
- Ports 80 and 443 open

### Quick Start

```bash
# 1. Create deployment directory
mkdir -p /opt/math-games && cd /opt/math-games

# 2. Download compose files
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/math-games/main/deploy/docker-compose.yml
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/math-games/main/deploy/Caddyfile

# 3. Configure domain
export DOMAIN=mathgames.yourschool.edu
export GITHUB_REPOSITORY=YOUR_USERNAME/math-games

# 4. Start services
docker-compose up -d

# 5. Check status
docker-compose ps
docker-compose logs -f
```

### Without Domain (HTTP only)

For local testing or IP-only access:

```bash
# Use dev compose file
docker-compose -f docker-compose.dev.yml up -d

# Access via http://SERVER_IP:3000
```

### Auto-Updates

Add Watchtower to automatically pull new images:

```yaml
# Add to docker-compose.yml
services:
  watchtower:
    image: containrrr/watchtower
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - WATCHTOWER_CLEANUP=true
      - WATCHTOWER_POLL_INTERVAL=300
    command: math-games
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DOMAIN` | `localhost` | Domain for HTTPS (Caddy) |
| `GITHUB_REPOSITORY` | `local` | GitHub repo for image pull |
| `TAG` | `latest` | Docker image tag |

---

## Resource Requirements

| Tier | RAM | vCPU | Monthly Cost |
|------|-----|------|--------------|
| Minimum | 512 MB | 1 | ~$4-5 |
| Recommended | 1 GB | 1 | ~$6-10 |

The app is a static site, so resource usage is minimal.
```

**Step 2: Verify file created**

```bash
cat docs/DEPLOYMENT.md | head -30
```

Expected: Deployment guide displayed.

**Step 3: Commit**

```bash
git add docs/DEPLOYMENT.md
git commit -m "docs: add self-hosted deployment guide

Covers Docker Compose setup, environment variables,
auto-updates with Watchtower, and resource requirements."
```

---

## Task 13: Final Verification - Run Full Build

**Files:**
- None (verification only)

**Step 1: Clean and rebuild**

```bash
rm -rf dist
npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Check bundle output**

```bash
ls -la dist/assets/*.js | wc -l
ls -la dist/assets/*.gz | wc -l
```

Expected: JS files present, equal number of .gz files.

**Step 3: Verify no dnd-vendor chunk**

```bash
ls dist/assets/ | grep dnd-vendor
```

Expected: No output (dnd-vendor chunk no longer exists).

---

## Task 14: Push and Verify CI

**Files:**
- None (verification only)

**Step 1: Push all commits**

```bash
git push origin main
```

Expected: Push succeeds.

**Step 2: Monitor GitHub Actions**

Open: https://github.com/YOUR_USERNAME/math-games/actions

Expected:
- Build job runs (~1.5 min)
- deploy-pages and build-docker run in parallel
- Both complete successfully

**Step 3: Verify Docker image in GHCR**

Open: https://github.com/YOUR_USERNAME/math-games/pkgs/container/math-games

Expected: Image tagged with `latest` and git SHA.

**Step 4: Verify GitHub Pages still works**

Open: https://YOUR_USERNAME.github.io/math-games/

Expected: App loads correctly, no regressions.

---

## Summary

| Task | Time | What it does |
|------|------|--------------|
| 1 | 2 min | Remove @dnd-kit from vendors |
| 2 | 3 min | Add compression plugin |
| 3 | 1 min | Create deploy directory |
| 4 | 3 min | Create nginx.conf |
| 5 | 3 min | Create Dockerfile |
| 6 | 2 min | Create Dockerfile.ci |
| 7 | 3 min | Create docker-compose.yml |
| 8 | 2 min | Create docker-compose.dev.yml |
| 9 | 2 min | Create Caddyfile |
| 10 | 5 min | Test Docker locally |
| 11 | 5 min | Update GitHub Actions |
| 12 | 5 min | Add documentation |
| 13 | 3 min | Final build verification |
| 14 | 5 min | Push and verify CI |
| **Total** | **~45 min** | |
