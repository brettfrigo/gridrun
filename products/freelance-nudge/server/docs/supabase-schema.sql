-- Freelance Nudge schema (Supabase/Postgres friendly)
-- Run in Supabase SQL editor for hosted backend.

create extension if not exists "pgcrypto";

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  client_name text not null,
  client_email text not null,
  invoice_number text not null,
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid', 'void')),
  notes text default '',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_user_id on public.invoices(user_id);
create index if not exists idx_invoices_due_date on public.invoices(due_date);
create unique index if not exists uq_invoice_number_per_user on public.invoices(user_id, invoice_number);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_invoices_updated_at on public.invoices;
create trigger trg_invoices_updated_at
before update on public.invoices
for each row execute function public.touch_updated_at();

-- Optional RLS (enable when auth is wired)
-- alter table public.invoices enable row level security;
-- create policy "users can manage their invoices"
-- on public.invoices
-- using (auth.uid() = user_id)
-- with check (auth.uid() = user_id);
