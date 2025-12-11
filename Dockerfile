# ===========================================
# DigitalOcean App Platform Compatible Dockerfile
# ===========================================
# This Dockerfile is optimized for Next.js standalone output
# which is required for DigitalOcean App Platform deployment.
#
# It also builds all games from the /games directory and 
# includes them in the /public/games folder.

# ===========================================
# Stage 1: Build All Games
# ===========================================
# This stage discovers and builds all game projects in the /games folder
FROM node:20-alpine AS games-builder
WORKDIR /app/games

# Copy the games source folder
COPY games/ ./

# Create output directory for built games
RUN mkdir -p /app/games-dist

# Install bash for more robust scripting
RUN apk add --no-cache bash

# Build each game that has a package.json
# Games are expected to output to a 'dist' directory
RUN /bin/bash -c '\
    echo "=== Starting Games Build ===" && \
    for dir in */; do \
    dir_name="${dir%/}"; \
    if [ -f "$dir_name/package.json" ]; then \
    echo ""; \
    echo "========================================"; \
    echo "Building Game: $dir_name"; \
    echo "========================================"; \
    cd "$dir_name" && \
    echo "Installing dependencies..." && \
    npm install && \
    echo "Running build..." && \
    npm run build && \
    if [ -d "dist" ]; then \
    echo "✓ Build successful, copying dist to output"; \
    mkdir -p /app/games-dist/"$dir_name" && \
    cp -r dist/* /app/games-dist/"$dir_name"/; \
    else \
    echo "⚠ WARNING: No dist folder found for $dir_name"; \
    fi && \
    cd ..; \
    else \
    echo "⚠ Skipping $dir_name (no package.json)"; \
    fi; \
    done && \
    echo "" && \
    echo "=== Games Build Complete ===" && \
    echo "Built games:" && \
    ls -la /app/games-dist/ \
    '

# ===========================================
# Stage 2: Install Dependencies
# ===========================================
FROM node:20-alpine AS deps
WORKDIR /app

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
# to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat

# Install dependencies only when needed
COPY package.json package-lock.json* ./
RUN npm ci

# ===========================================
# Stage 3: Build Next.js Application
# ===========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy all source files
COPY . .

# Copy built games into public/games directory
# This makes them available at /games/* in the final app
COPY --from=games-builder /app/games-dist ./public/games

# Set build-time environment variables
# These are required for NEXT_PUBLIC_* variables to be embedded in the client bundle
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_MATCHMAKING_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GAMES_BASE_URL=/games

ENV NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
ENV NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
ENV NEXT_PUBLIC_MATCHMAKING_URL=${NEXT_PUBLIC_MATCHMAKING_URL}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_GAMES_BASE_URL=${NEXT_PUBLIC_GAMES_BASE_URL}

ARG NEXT_PUBLIC_CASHFREE_BACKEND_URL
ARG NEXT_PUBLIC_CASHFREE_ENVIRONMENT
ENV NEXT_PUBLIC_CASHFREE_BACKEND_URL=${NEXT_PUBLIC_CASHFREE_BACKEND_URL}
ENV NEXT_PUBLIC_CASHFREE_ENVIRONMENT=${NEXT_PUBLIC_CASHFREE_ENVIRONMENT}
# Build the application
# Next.js collects anonymous telemetry data - disable it
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===========================================
# Stage 4: Production Runtime (Standalone)
# ===========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user for security (required by DigitalOcean)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (includes built games in /public/games)
COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir -p .next
RUN chown nextjs:nodejs .next

# Standalone build output - this is the key for DigitalOcean
# Automatically leverages output traces to output a standalone folder
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Firebase credentials are loaded from FIREBASE_SERVICE_ACCOUNT_KEY env var (Base64 encoded)
# Set this in DigitalOcean App Platform environment variables

# Switch to non-root user
USER nextjs

# Expose the port (DigitalOcean uses PORT env variable)
EXPOSE 3000

# Start the standalone server
# This is the correct way to run Next.js standalone builds
CMD ["node", "server.js"]
