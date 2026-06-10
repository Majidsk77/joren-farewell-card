-- ============================================================
-- Farewell Card — Supabase setup
-- Run this entire file in the Supabase SQL Editor once.
-- ============================================================

-- ── Table ─────────────────────────────────────────────────────────────────

create table if not exists public.cards (
  id           uuid        primary key default gen_random_uuid(),
  name         text        not null,
  relationship text,
  message      text        not null,
  theme        text        not null default 'warm',
  spotify_url  text,
  photo_urls   text[]      not null default '{}',
  approved     boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- ── Row Level Security ─────────────────────────────────────────────────────

alter table public.cards enable row level security;

-- Anyone can read approved cards (the public /card page)
create policy "public_read_approved"
  on public.cards for select
  using (approved = true);

-- Anyone can submit a new card via the contributor form
-- The check enforces that submitted cards start as unapproved
create policy "public_insert"
  on public.cards for insert
  with check (approved = false);

-- Service-role key bypasses RLS — used server-side for admin operations
-- (approve, delete). No additional policy needed.

-- ── Storage bucket ─────────────────────────────────────────────────────────
-- Run this in the Supabase dashboard → Storage → New bucket:
--   Bucket name: card-photos
--   Public bucket: YES  (so uploaded images have stable public URLs)
--
-- Then add these Storage policies (Dashboard → Storage → card-photos → Policies):
--
-- 1. Allow anyone to upload (contributors)
--    Policy name: public_upload
--    Operation:   INSERT
--    Expression:  true
--
-- 2. Block public listing (optional privacy)
--    Policy name: no_public_list
--    Operation:   SELECT
--    Expression:  false
--
-- The service-role key used in deleteCard() can delete files regardless of RLS.
--
-- Alternatively, run these SQL statements:

insert into storage.buckets (id, name, public)
values ('card-photos', 'card-photos', true)
on conflict (id) do nothing;

create policy "public_upload_card_photos"
  on storage.objects for insert
  to public
  with check (bucket_id = 'card-photos');
