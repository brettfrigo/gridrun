# STATUS

## Done
- Added backend in `server/` with Express mock API and file-backed local storage.
- Added Supabase-friendly schema in `server/docs/supabase-schema.sql`.
- Implemented invoice CRUD + reminder generation endpoints.
- Migrated frontend to **Onlook-native stack**:
  - Next.js app router (`app/`)
  - Tailwind CSS styling
  - API-backed invoice workflows (create/list/pay/reminder)
  - Filter/sort controls and CSV export
  - Free plan gate + Pro modal
  - API health indicator + improved empty states
- Added landing page in `site/` with pricing, FAQ, and CTA.
- Added local scripts for web + server dev.

## Remaining
- Add auth + multi-user support for hosted production.
- Add automated tests and CI checks.
- Add edit/delete UI controls in the Next.js frontend (backend endpoints exist).
