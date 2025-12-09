# Games Hosting Guide

This document explains how to host game static files for the Oreo App.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Game Loading Flow                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. User accepts game invite                                             │
│  2. GameFrame.tsx builds URL:                                            │
│     gameUrl = `${NEXT_PUBLIC_GAMES_BASE_URL}/${gameId}?params...`        │
│  3. iframe loads game from that URL                                      │
│  4. Game establishes WebRTC connection via URL params                    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Hosting Options

### Option 1: Local Development (Vite Dev Server)

For local development, games run on a separate Vite dev server.

```env
NEXT_PUBLIC_GAMES_BASE_URL=http://localhost:3000
```

**Setup:**
```bash
cd games/knife-throw
npm install
npm run dev  # Runs on localhost:3000
```

---

### Option 2: Self-Hosted (Docker/Ubuntu)

Games are bundled into the Next.js app's `/public/games` folder.

```env
NEXT_PUBLIC_GAMES_BASE_URL=/games
```

**How it works:**
- Dockerfile builds all games and copies to `public/games/`
- Next.js serves them as static files at `/games/{game-id}/`
- No separate server needed

**Build with Docker:**
```bash
docker build -t oreo-app .
# Games automatically included at /games/knife-throw/, etc.
```

---

### Option 3: CDN Hosting (Cloudflare R2 + CDN)

Best for production - global edge caching, faster load times.

```env
NEXT_PUBLIC_GAMES_BASE_URL=https://games.yourdomain.com
```

**Build with Docker (CDN mode):**
```bash
docker build --build-arg NEXT_PUBLIC_GAMES_BASE_URL=https://games.yourdomain.com -t oreo-app .
```

---

## Cloudflare R2 Setup Guide

### Step 1: Create Cloudflare Account & R2 Bucket

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name it: `oreo-games`
5. Select location hint (closest to your users)

### Step 2: Enable Public Access

#### Option A: Custom Domain (Recommended for Production)

1. Go to bucket **Settings** → **Public Access**
2. Click **Connect Domain**
3. Enter subdomain: `games.yourdomain.com`
4. Cloudflare auto-configures DNS & SSL

#### Option B: R2.dev Subdomain (Quick Testing)

1. Go to bucket **Settings** → **Public Access**
2. Enable **R2.dev subdomain**
3. You get: `https://pub-xxxxx.r2.dev`

> ⚠️ R2.dev URLs are rate-limited, not for production.

### Step 3: Create API Token

1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Configure:
   - Token name: `oreo-games-deploy`
   - Permissions: `Object Read & Write`
   - Bucket: Select `oreo-games`
4. Save credentials:
   - Access Key ID
   - Secret Access Key
   - Account ID (top of R2 page)

### Step 4: Configure CORS

In bucket **Settings** → **CORS Policy**, add:

```json
[
  {
    "AllowedOrigins": [
      "https://yourdomain.com",
      "https://app.yourdomain.com",
      "http://localhost:9191"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 86400
  }
]
```

### Step 5: Deploy Games

Create `scripts/deploy-games-r2.sh`:

```bash
#!/bin/bash

# Configuration
R2_BUCKET="oreo-games"
R2_ACCOUNT_ID="your-account-id"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"

# Build all games
echo "Building games..."
for dir in games/*/; do
    game_name=$(basename "$dir")
    if [ -f "$dir/package.json" ]; then
        echo "Building: $game_name"
        cd "$dir"
        npm install
        npm run build
        cd ../..
    fi
done

# Upload to R2 using rclone
echo "Uploading to R2..."

# Configure rclone (one-time)
cat > ~/.config/rclone/rclone.conf << EOF
[r2]
type = s3
provider = Cloudflare
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
endpoint = https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
acl = public-read
EOF

# Upload each game's dist folder
for dir in games/*/; do
    game_name=$(basename "$dir")
    if [ -d "$dir/dist" ]; then
        echo "Uploading: $game_name"
        rclone sync "$dir/dist/" "r2:${R2_BUCKET}/${game_name}/" \
            --transfers 10 \
            --checkers 20 \
            --fast-list
    fi
done

echo "✅ Games deployed to R2!"
echo "Access at: https://games.yourdomain.com/{game-name}/"
```

**Make executable and run:**
```bash
chmod +x scripts/deploy-games-r2.sh
./scripts/deploy-games-r2.sh
```

### Step 6: Set Cache Headers (Optional)

For better performance, configure cache headers in Cloudflare:

1. Go to **Rules** → **Transform Rules** → **Modify Response Header**
2. Add rule for `games.yourdomain.com/*`:
   - `Cache-Control`: `public, max-age=31536000, immutable`

---

## Environment Configuration Summary

| Environment | NEXT_PUBLIC_GAMES_BASE_URL | Notes |
|-------------|---------------------------|-------|
| Local Dev | `http://localhost:3000` | Vite dev server |
| Docker Self-Hosted | `/games` | Bundled in public folder |
| CDN (R2) | `https://games.yourdomain.com` | External CDN |

---

## Troubleshooting

### Game not loading in iframe

1. Check browser console for CORS errors
2. Verify CORS policy on R2 bucket includes your app origin
3. Check `NEXT_PUBLIC_GAMES_BASE_URL` is set correctly

### Game loads but WebRTC fails

1. Ensure URL params are being passed correctly
2. Check matchmaking server is accessible from game origin
3. Verify ICE/TURN server configuration

### 404 errors on game assets

1. Check game was built (`npm run build`)
2. Verify `dist/` folder exists with `index.html`
3. For R2, check files were uploaded to correct path
