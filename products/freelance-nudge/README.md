# Freelance Nudge

Freelance Nudge is a lightweight invoicing follow-up assistant for freelancers and small agencies.

## What’s included

- **Onlook-native web app** (`app/`) built with **Next.js + Tailwind CSS**
- **Mock API backend** (`server/`) with invoice CRUD and reminder generation
- **Supabase-ready schema docs** (`server/docs/supabase-schema.sql`)
- **Landing page** (`site/`) with pricing, FAQ, and CTA

## Features

- Track outstanding invoices (API-backed)
- Dashboard metrics (open count, outstanding, overdue, avg late days, collection score)
- One-click reminder email generation (friendly → firm → final)
- Free plan limit (10 invoices) + Pro upsell prompt
- CSV export of visible invoices
- Mark invoices paid
- Filter + sort invoice table

## Quick start (local)

```bash
cd products/freelance-nudge
npm install
npm --prefix server install
npm run dev
```

- Web app: `http://localhost:4173`
- API: `http://localhost:8787`

By default the app calls `http://localhost:8787`.
Override with:

```bash
NEXT_PUBLIC_FN_API_URL=http://localhost:8787
```

## Scripts

- `npm run dev` — run Next.js app + backend concurrently
- `npm run dev:web` — run Next.js app
- `npm run dev:server` — run Express backend in watch mode
- `npm run build` — production build of web app
- `npm run start:web` — run built web app
- `npm run start:server` — run backend

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for frontend/backend deployment options.
