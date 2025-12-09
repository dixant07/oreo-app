@echo off
echo ==========================================
echo Starting Deployment Process
echo ==========================================

echo 1. Cleanup old containers...
docker stop oreo-app-container 2>nul
docker rm oreo-app-container 2>nul

echo 2. Building Docker Image...
docker build -t oreo-app .

echo 3. Starting New Container...
:: Using --env-file to pass environment variables from .env.local
docker run -d -p 9191:9191 --env-file .env.local --name oreo-app-container oreo-app

echo ==========================================
echo Deployment Successful!
echo Oreo App running at: http://localhost:9191
echo ==========================================
pause

