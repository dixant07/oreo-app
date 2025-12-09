#!/bin/bash

echo "=========================================="
echo "Starting Deployment Process"
echo "=========================================="

echo "1. Cleanup old containers..."
# Stop and remove the container if it exists, ignoring errors if it doesn't
docker stop oreo-app-container >/dev/null 2>&1 || true
docker rm oreo-app-container >/dev/null 2>&1 || true

echo "2. Building Docker Image..."
# Build the docker image
# Default: Games served from /games path (self-hosted)
# For CDN: Add --build-arg NEXT_PUBLIC_GAMES_BASE_URL=https://games.yourdomain.com
docker build -t oreo-app .

echo "3. Starting New Container..."
# Run the container with environment variables from .env.local
docker run -d -p 9191:9191 --env-file .env.local --name oreo-app-container oreo-app

echo "=========================================="
echo "Deployment Successful!"
echo "Oreo App running at: http://localhost:9191"
echo "=========================================="

