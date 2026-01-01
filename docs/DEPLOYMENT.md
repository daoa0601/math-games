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
