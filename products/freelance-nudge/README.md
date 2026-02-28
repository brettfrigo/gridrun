# Freelance Nudge

Freelance Nudge is a lightweight invoicing follow-up assistant for freelancers and small agencies.

## What’s included

- **Dashboard app** (`index.html`) for invoice tracking + reminder generation
- **Mock API backend** (`server/`) with invoice CRUD and reminder generation
- **Supabase-ready schema docs** (`server/docs/supabase-schema.sql`)
- **Landing page** (`site/`) with pricing, FAQ, and CTA

## Features

- Track outstanding invoices (via backend API)
- Dashboard metrics (open count, outstanding, overdue, avg late days, collection score)
- One-click reminder email generation (friendly → firm → final)
- Free plan limit (10 invoices) + Pro upsell prompt
- CSV export of invoices
- Mark invoices paid (syncs to backend)

## Quick start (local)

```bash
cd products/freelance-nudge
npm install
npm --prefix server install
npm run dev
```

- App: `http://localhost:4173`
- API: `http://localhost:8787`

By default the app calls `http://localhost:8787`. You can override it by setting `window.FN_API_URL` before loading `app.js`.

## Scripts

- `npm run dev` — run frontend + backend concurrently
- `npm run dev:app` — run static app
- `npm run dev:server` — run Express backend in watch mode
- `npm run start:app` — run static app (prod-like)
- `npm run start:server` — run backend (prod-like)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel/Netlify + Render/Railway steps.
