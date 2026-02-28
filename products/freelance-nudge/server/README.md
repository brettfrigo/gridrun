# Freelance Nudge API (local mock + hosted-ready schema)

This server provides a local Express API for invoice CRUD + reminder generation, with Supabase-friendly schema docs in `docs/supabase-schema.sql`.

## Run locally

```bash
npm install
npm run dev
```

Default URL: `http://localhost:8787`

## Endpoints

- `GET /health`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `POST /api/invoices`
- `PUT /api/invoices/:id`
- `PATCH /api/invoices/:id/pay`
- `DELETE /api/invoices/:id`
- `POST /api/reminders/generate`

### Create invoice payload

```json
{
  "clientName": "Acme Studio",
  "clientEmail": "billing@acme.com",
  "invoiceNumber": "INV-1042",
  "amount": 1500,
  "dueDate": "2026-03-05",
  "status": "unpaid",
  "notes": "Net 15"
}
```

### Reminder generation payload

```json
{
  "invoiceId": "abc123"
}
```

Or pass a raw invoice object as `invoice`.

## Data storage

- Local dev data: `server/data/invoices.json`
- Hosted recommendation: Supabase Postgres using `docs/supabase-schema.sql`
