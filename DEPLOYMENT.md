# DigitalOcean App Platform Deployment Guide

This document guides you through deploying the Oreo App to DigitalOcean App Platform via GitHub.

## Prerequisites

1. **DigitalOcean Account**: [Sign up](https://www.digitalocean.com/)
2. **GitHub Repository**: Your code pushed to GitHub
3. **DigitalOcean Personal Access Token**: For GitHub Actions deployment

---

## Games Folder Structure

The `/games` folder contains source code for all game clients. During Docker build, each game is automatically built and included in `/public/games`.

### Current Structure:

```
games/
├── knife-throw/          # Knife throwing game
│   ├── package.json      # Must have "build" script
│   ├── vite.config.js    # Vite configuration
│   ├── src/              # Game source code
│   └── dist/             # Build output (auto-generated)
├── tic-tac-toe/          # (Example) Add more games here
│   ├── package.json
│   └── ...
└── another-game/
    └── ...
```

### Adding a New Game:

1. **Create game folder** in `/games`:
   ```bash
   mkdir games/my-new-game
   cd games/my-new-game
   npm init -y
   ```

2. **Ensure `package.json` has a build script**:
   ```json
   {
     "name": "my-new-game",
     "scripts": {
       "build": "vite build"
     }
   }
   ```

3. **Game must output to `dist/` folder** (Vite default)

4. **Push to GitHub** - the game will be automatically built and deployed

### How Games are Accessed:

After deployment, games are available at:
- `https://your-app.ondigitalocean.app/games/knife-throw/index.html`
- `https://your-app.ondigitalocean.app/games/my-new-game/index.html`

The `NEXT_PUBLIC_GAMES_BASE_URL` environment variable is set to `/games` by default.

---

### Step 1: Push to GitHub

```bash
git add .
git commit -m "Add DigitalOcean deployment configuration"
git push origin main
```

### Step 2: Create App in DigitalOcean

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click **"Create App"**
3. Select **GitHub** as the source
4. Authorize DigitalOcean to access your repository
5. Select your repository and branch (`main`)
6. DigitalOcean will auto-detect the Dockerfile

### Step 3: Configure Environment Variables

In the DigitalOcean dashboard, go to **Settings > App-Level Environment Variables** and add:

#### Build-Time Variables (Required for client-side code)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_MATCHMAKING_URL` | Matchmaking server URL |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL (set after first deploy) |

#### Runtime Variables (Required for server-side code)

| Variable | Description |
|----------|-------------|
| `FIREBASE_PROJECT_ID` | Firebase Project ID |
| `MATCHMAKING_URL` | Matchmaking server internal URL |
| `MATCHMAKING_SERVER_KEY` | Server authentication key |
| `CASHFREE_CLIENT_ID` | Cashfree payment client ID |
| `CASHFREE_CLIENT_SECRET` | Cashfree payment client secret |
| `CASHFREE_ENVIRONMENT` | `SANDBOX` or `PRODUCTION` |
| `TURN_SHARED_SECRET` | TURN server shared secret |
| `TURN_SERVER_URL` | TURN server URL |

### Step 4: Deploy

Click **"Create Resources"** and wait for the deployment to complete.

---

## Automated Deployment (via GitHub Actions)

### Step 1: Generate DigitalOcean API Token

1. Go to [DigitalOcean API Tokens](https://cloud.digitalocean.com/account/api/tokens)
2. Click **"Generate New Token"**
3. Give it a name (e.g., `github-actions-deploy`)
4. Select **Read** and **Write** scopes
5. Copy the token

### Step 2: Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `DIGITALOCEAN_ACCESS_TOKEN` | Your DigitalOcean API token |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID |
| `NEXT_PUBLIC_MATCHMAKING_URL` | Matchmaking server URL |
| `NEXT_PUBLIC_APP_URL` | Your app's public URL |

### Step 3: Update App Spec

Edit `.do/app.yaml` and replace `YOUR_GITHUB_USERNAME/knife-throw` with your actual GitHub repository path.

### Step 4: Push Changes

```bash
git add .
git commit -m "Configure automated deployment"
git push origin main
```

The GitHub Actions workflow will automatically deploy to DigitalOcean.

---

## File Structure

```
.
├── .do/
│   └── app.yaml           # DigitalOcean App Platform specification
├── .github/
│   └── workflows/
│       ├── deploy-digitalocean.yml  # Auto-deploy on push to main
│       └── video-client-deploy.yml  # Build/test for PRs
├── Dockerfile             # Production-optimized Docker build
└── DEPLOYMENT.md          # This file
```

---

## Troubleshooting

### Build Fails

1. Check that all `NEXT_PUBLIC_*` environment variables are set as **Build-Time** variables
2. Ensure the Dockerfile is at the root of your repository
3. Check the build logs in the DigitalOcean dashboard

### App Doesn't Start

1. Verify `PORT=3000` is set correctly
2. Check that `NODE_ENV=production` is set
3. Review runtime logs in the DigitalOcean dashboard

### Firebase Errors

1. Ensure `oreo-video-app-v1-firebase-adminsdk-fbsvc-751f63dcd0.json` is in the repository
2. Or configure `GOOGLE_APPLICATION_CREDENTIALS` as a runtime environment variable

### WebRTC/TURN Issues

1. Verify `TURN_SERVER_URL` is correctly set
2. Ensure `TURN_SHARED_SECRET` matches your TURN server configuration
3. Check CORS settings on your matchmaking server

---

## Cost Estimation

| Plan | Monthly Cost | Specs |
|------|--------------|-------|
| basic-xxs | $5 | 512 MB RAM, 1 vCPU |
| basic-xs | $10 | 1 GB RAM, 1 vCPU |
| basic-s | $20 | 2 GB RAM, 1 vCPU |

For production, start with `basic-xs` and scale based on traffic.

---

## Useful Commands

```bash
# Install doctl CLI
brew install doctl  # macOS
# or download from https://docs.digitalocean.com/reference/doctl/

# Authenticate
doctl auth init

# List apps
doctl apps list

# Get app details
doctl apps get <app-id>

# View logs
doctl apps logs <app-id>

# Deploy manually
doctl apps create --spec .do/app.yaml
```
