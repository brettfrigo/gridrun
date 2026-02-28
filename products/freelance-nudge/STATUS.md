# STATUS

## Done
- Added backend in `server/` with Express mock API and file-backed local storage.
- Added Supabase-friendly schema in `server/docs/supabase-schema.sql`.
- Implemented invoice CRUD + reminder generation endpoints.
- Upgraded frontend with:
  - Free plan limit (10 invoices)
  - Pro upgrade prompt modal/banner
  - CSV export
  - Improved dashboard metrics cards
- Added polished landing page in `site/` with pricing, FAQ, and CTA.
- Added deployment guide for Vercel/Netlify (frontend) + Render/Railway (backend).
- Added `package.json` scripts for local app/server development.

## Remaining
- Wire frontend to backend API (currently frontend remains localStorage-first MVP).
- Add auth + multi-user support for hosted production.
- Add automated tests and CI checks.
