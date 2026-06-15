-- ============================================================================
-- OnlyLinks :: Stripe billing
-- Adds subscription tracking to profiles and a link_unlocks table for
-- one-time paid link access.
-- ============================================================================

-- profiles: subscription columns ----------------------------------------

alter table public.profiles
  add column if not exists stripe_customer_id  text unique,
  add column if not exists subscription_status text not null default 'free',
  add column if not exists subscription_id     text unique;

-- link_unlocks: records a visitor paying to reveal a locked link ----------

create table if not exists public.link_unlocks (
  id                uuid        primary key default gen_random_uuid(),
  link_id           uuid        not null references public.links(id) on delete cascade,
  stripe_session_id text        not null unique,
  visitor_id        text,       -- fingerprint from analytics (best-effort)
  email             text,       -- captured by Stripe Checkout
  created_at        timestamptz not null default now()
);

create index if not exists link_unlocks_link_id_idx
  on public.link_unlocks (link_id);

create index if not exists link_unlocks_visitor_id_idx
  on public.link_unlocks (visitor_id)
  where visitor_id is not null;

-- RLS -----------------------------------------------------------------------

alter table public.link_unlocks enable row level security;

-- Anyone may insert (webhook runs as service role, so this covers anon inserts
-- from the success redirect too — but we do writes via service role in webhook).
create policy "link_unlocks_insert_anyone"
  on public.link_unlocks for insert
  to anon, authenticated
  with check (true);

-- Owner of the link may read their unlock records.
create policy "link_unlocks_select_owner"
  on public.link_unlocks for select
  to authenticated
  using (
    exists (
      select 1
      from public.links l
      where l.id = link_unlocks.link_id
        and l.profile_id = auth.uid()
    )
  );
