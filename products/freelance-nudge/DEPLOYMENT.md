# Freelance Nudge Deployment Guide

## Architecture
- **Frontend app:** static site (`products/freelance-nudge/index.html`, `app.js`, `styles.css`)
- **Landing page:** static marketing site (`products/freelance-nudge/site`)
- **Backend API:** Node/Express (`products/freelance-nudge/server`)

## Frontend on Vercel
1. Import repo into Vercel.
2. Set project root to `products/freelance-nudge`.
3. Framework preset: **Other**.
4. Build command: *(empty)*.
5. Output directory: `.`
6. Deploy.

### Optional split deployment
- Create a second Vercel project rooted at `products/freelance-nudge/site` for dedicated marketing URL.

## Frontend on Netlify
1. New site from Git.
2. Base directory: `products/freelance-nudge` (or `products/freelance-nudge/site` for landing-only).
3. Build command: *(empty)*.
4. Publish directory: `.` (or `site`).
5. Deploy.

## Backend on Render
1. New **Web Service** from repo.
2. Root directory: `products/freelance-nudge/server`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Set environment variable `PORT` (Render also injects one automatically).
6. Deploy.

## Backend on Railway
1. New Project → Deploy from GitHub.
2. Set service root to `products/freelance-nudge/server`.
3. Railway auto-detects Node app.
4. Ensure start command is `npm start`.
5. Deploy.

## Hosted database migration (Supabase)
1. Create Supabase project.
2. Open SQL editor.
3. Run `server/docs/supabase-schema.sql`.
4. Swap local JSON store with Supabase queries in `server/src/index.js`.

## Local run (full stack)

```bash
cd products/freelance-nudge
npm install
npm --prefix server install
npm run dev
```

- App: `http://localhost:4173`
- API: `http://localhost:8787`
