-- Catch-up migration: align the repo's schema with the live database.
--
-- Background: the `status` column (and a legacy `completed` column) were added
-- directly in the Supabase dashboard around 2026-02-19 (v1.3.0 "status
-- persistence") but were never captured as a migration. Production worked
-- because the live DB was hand-altered, but any environment rebuilt from
-- `supabase/migrations/` lacked both columns, which silently broke the status
-- feature there (updates returned PGRST204; every row rendered "not started").
--
-- This migration is idempotent: `IF NOT EXISTS` makes it a safe no-op against
-- the live database while ensuring fresh environments get the correct schema.

-- The status dropdown values used by the app:
--   "not started" | "in progress" | "completed"   (null is treated as "not started")
alter table public.assignments
  add column if not exists status text;

-- Legacy column present in the live DB. The frontend never reads or writes it,
-- but mirroring reality keeps the repo schema authoritative. It is NOT NULL in
-- the live DB and the app inserts rows successfully, so it carries a default.
alter table public.assignments
  add column if not exists completed boolean not null default false;

-- Hardening (optional but recommended): constrain status to the values the app
-- actually writes. Uncomment only after confirming no live rows violate it:
--   select status, count(*) from public.assignments group by status;
-- alter table public.assignments
--   add constraint assignments_status_check
--   check (status is null or status in ('not started', 'in progress', 'completed'));
