# Optimization & CI/CD Design

**Date:** 2026-01-01
**Status:** Approved
**Goal:** Minimize bandwidth/hosting costs, enable self-hosted Docker deployment while keeping GitHub Pages as primary.

---

## Overview

This design implements a hybrid deployment strategy:
- **Primary:** GitHub Pages (free, current setup)
- **Ready:** Docker image for self-hosted deployment when needed

The approach optimizes bundle size, adds proper caching, and creates a portable Docker configuration without disrupting the current workflow.

---

## Part 1: Bundle Optimization

### Current State

| Metric | Value |
|--------|-------|
| Total dist size | ~1.9 MB uncompressed |
| Gzipped transfer | ~570 KB |
| Initial load | ~350 KB gzipped |
| Largest chunk | three-vendor (366 KB gzipped) |

### Optimizations to Implement

#### 1.1 Remove @dnd-kit from Vendor Chunks

**Problem:** `@dnd-kit` is only used by ShapeArchitect but loaded as separate vendor chunk.

**Solution:** Remove from `manualChunks` in `vite.config.ts`:

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
  'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
  // REMOVE: 'dnd-vendor': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
}
```

**Impact:** Saves ~13 KB separate request; bundles with ShapeArchitect chunk instead.

#### 1.2 Add Vite Compression Plugin

**Purpose:** Pre-compress assets at build time for faster serving.

**Install:**
```bash
npm install -D vite-plugin-compression
```

**Configure in `vite.config.ts`:**
```typescript
import viteCompression from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    // ... existing plugins
    viteCompression({ algorithm: 'gzip' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
  ],
});
```

**Impact:** Nginx/Caddy serve pre-compressed files without CPU overhead.

### Expected Results

| Metric | Before | After |
|--------|--------|-------|
| Initial load | ~350 KB | ~320 KB |
| Separate requests | 12 chunks | 11 chunks |
| Server CPU (compression) | Runtime | Zero (pre-compressed) |

---

## Part 2: Caching Strategy

### Cache Rules

| Path Pattern | Cache Duration | Reason |
|--------------|----------------|--------|
| `/assets/*` | 1 year, immutable | Content-hashed filenames |
| `/sounds/*` | 1 year | Static audio files |
| `/index.html` | No cache | Entry point must be fresh |
| `/*.js` (root) | No cache | Service worker, if added |
| `/favicon.ico` | 1 week | Rarely changes |

### Implementation

#### 2.1 GitHub Pages: `public/_headers`

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache, must-revalidate

/favicon.ico
  Cache-Control: public, max-age=604800
```

> Note: GitHub Pages has limited `_headers` support. Full caching works in Docker deployment.

#### 2.2 Docker nginx: `deploy/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;

    # Gzip/Brotli for non-precompressed requests
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;

    # Serve pre-compressed files if available
    gzip_static on;
    brotli_static on;

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Immutable assets (hashed filenames)
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

    # HTML - no cache
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
}
```

### Bandwidth Impact

| Visitor Type | Data Transfer |
|--------------|---------------|
| First visit | ~320 KB |
| Return visit (same version) | ~2 KB |
| Return visit (after update) | Only changed chunks |

For 10,000 daily users with 50% return rate: **~1.5 GB/day saved**.

---

## Part 3: Docker Deployment Setup

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Docker Host                                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  docker-compose.yml                               │  │
│  │  ┌─────────────┐         ┌─────────────────────┐  │  │
│  │  │   Caddy     │  :443   │   math-games        │  │  │
│  │  │  (reverse   │────────▶│   (nginx:alpine     │  │  │
│  │  │   proxy +   │  :80    │    static files)    │  │  │
│  │  │   HTTPS)    │         │                     │  │  │
│  │  └─────────────┘         └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### File: `deploy/Dockerfile`

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine AS production

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### File: `deploy/docker-compose.yml`

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

  math-games:
    image: ghcr.io/${GITHUB_REPOSITORY:-local}/math-games:${TAG:-latest}
    restart: unless-stopped
    expose:
      - "80"

volumes:
  caddy_data:
  caddy_config:
```

### File: `deploy/docker-compose.dev.yml`

```yaml
version: '3.8'

services:
  math-games:
    build:
      context: ..
      dockerfile: deploy/Dockerfile
    ports:
      - "3000:80"
```

### File: `deploy/Caddyfile`

```
{$DOMAIN:localhost} {
    reverse_proxy math-games:80

    # Security headers
    header {
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logging
    log {
        output stdout
        format console
    }
}
```

### Resource Requirements

| Tier | RAM | vCPU | Monthly Cost |
|------|-----|------|--------------|
| Minimum | 512 MB | 1 | ~$4 (Hetzner) |
| Recommended | 1 GB | 1 | ~$6 (DigitalOcean) |

---

## Part 4: CI/CD Pipeline

### Updated Workflow: `.github/workflows/deploy.yml`

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

### File: `deploy/Dockerfile.ci`

Simplified Dockerfile for CI (dist already built):

```dockerfile
FROM nginx:alpine

# Copy custom nginx config
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

# Copy pre-built assets
COPY dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Build Time Estimate

| Stage | Time |
|-------|------|
| Checkout + Install | ~20s |
| Test | ~30s |
| Build | ~45s |
| GitHub Pages deploy | ~30s |
| Docker build + push | ~40s (parallel) |
| **Total** | **~2 min** |

---

## Part 5: Self-Hosted Deployment Guide

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

# 4. Start services
docker-compose up -d

# 5. Check status
docker-compose ps
docker-compose logs -f
```

### Auto-Updates with Watchtower (Optional)

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
      - WATCHTOWER_POLL_INTERVAL=300  # Check every 5 minutes
    command: math-games  # Only watch this container
```

### Without Domain (Local/IP Access)

```bash
# Use docker-compose.dev.yml for HTTP-only access
docker-compose -f docker-compose.dev.yml up -d

# Access via http://SERVER_IP:3000
```

---

## Implementation Checklist

### Phase 1: Bundle Optimization (~30 min)
- [ ] Remove `@dnd-kit` from `manualChunks` in `vite.config.ts`
- [ ] Install `vite-plugin-compression`
- [ ] Configure gzip + brotli compression
- [ ] Run build, verify output sizes

### Phase 2: Docker Setup (~1 hour)
- [ ] Create `deploy/` directory
- [ ] Create `deploy/Dockerfile`
- [ ] Create `deploy/Dockerfile.ci`
- [ ] Create `deploy/nginx.conf`
- [ ] Create `deploy/docker-compose.yml`
- [ ] Create `deploy/docker-compose.dev.yml`
- [ ] Create `deploy/Caddyfile`
- [ ] Test locally: `docker-compose -f deploy/docker-compose.dev.yml up --build`

### Phase 3: CI/CD Update (~30 min)
- [ ] Update `.github/workflows/deploy.yml`
- [ ] Verify GitHub Pages still deploys
- [ ] Verify Docker image pushed to GHCR
- [ ] Test pulling image: `docker pull ghcr.io/USERNAME/math-games:latest`

### Phase 4: Documentation (~30 min)
- [ ] Add self-hosted guide to `docs/DEPLOYMENT.md`
- [ ] Update `README.md` with deployment options
- [ ] Document environment variables

---

## Cost Summary

| Deployment Target | Monthly Cost | Notes |
|-------------------|--------------|-------|
| GitHub Pages | $0 | Primary, current setup |
| Docker image (GHCR) | $0 | Stored free for public repos |
| Self-hosted (when needed) | $0-6 | Free with student credits |

**Total: $0/month** while using GitHub Pages + student credits for self-hosted testing.

---

## Future Considerations

### If Traffic Exceeds GitHub Pages Limits
- Switch primary to Cloudflare Pages (still free, better caching)
- Docker setup ready for instant self-hosted migration

### If Schools Need Isolated Deployments
- Each school runs own Docker stack
- Centralized image updates via GHCR
- Optional: Add Watchtower for automatic updates

### Performance Monitoring (If Needed Later)
- Add Lighthouse CI to workflow
- Add bundle size budgets
- Both disabled for now per design requirements
