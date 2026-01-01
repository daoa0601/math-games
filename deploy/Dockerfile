# Stage 1: Build
FROM node:22-alpine AS builder

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

# Install curl for health check (wget not available in nginx:alpine)
RUN apk add --no-cache curl

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
