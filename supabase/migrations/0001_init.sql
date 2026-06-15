-- ============================================================================
-- OnlyLinks :: initial schema, indexes, Row-Level Security, and avatar storage
-- ============================================================================
-- Apply via the Supabase SQL Editor (paste & run) or the Supabase CLI:
--   supabase db push
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- profiles: one per auth user
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  handle       text unique not null,
  display_name text,
  bio          text,
  avatar_url   text,
  theme        text not null default 'default',
  created_at   timestamptz not null default now()
);

-- links: many per profile
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  url         text not null,
  position    int  not null default 0,
  is_locked   boolean not null default false,   -- v2 hook (ignored at runtime in v1)
  price_cents int,                              -- v2 hook, null = free
  created_at  timestamptz not null default now()
);

create index if not exists links_profile_id_position_idx
  on public.links (profile_id, position);

-- click_events: analytics
create table if not exists public.click_events (
  id          uuid primary key default gen_random_uuid(),
  link_id     uuid not null references public.links(id) on delete cascade,
  referrer    text,
  created_at  timestamptz not null default now()
);

create index if not exists click_events_link_id_idx
  on public.click_events (link_id);

-- page_views: analytics
create table if not exists public.page_views (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now()
);

create index if not exists page_views_profile_id_idx
  on public.page_views (profile_id);

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------

alter table public.profiles     enable row level security;
alter table public.links        enable row level security;
alter table public.click_events enable row level security;
alter table public.page_views   enable row level security;

-- profiles ---------------------------------------------------------------
-- Public can read every profile (the public page needs it).
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = id);

-- links ------------------------------------------------------------------
-- Public can read every link (rendered on the public page).
create policy "links_select_public"
  on public.links for select
  using (true);

create policy "links_insert_own"
  on public.links for insert
  to authenticated
  with check (auth.uid() = profile_id);

create policy "links_update_own"
  on public.links for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

create policy "links_delete_own"
  on public.links for delete
  to authenticated
  using (auth.uid() = profile_id);

-- click_events -----------------------------------------------------------
-- Anyone (including anonymous visitors) may log a click. The FK guarantees
-- the link exists. Only the owning profile's user may read the events.
create policy "click_events_insert_anyone"
  on public.click_events for insert
  to anon, authenticated
  with check (true);

create policy "click_events_select_owner"
  on public.click_events for select
  to authenticated
  using (
    exists (
      select 1
      from public.links l
      where l.id = click_events.link_id
        and l.profile_id = auth.uid()
    )
  );

-- page_views -------------------------------------------------------------
create policy "page_views_insert_anyone"
  on public.page_views for insert
  to anon, authenticated
  with check (true);

create policy "page_views_select_owner"
  on public.page_views for select
  to authenticated
  using (auth.uid() = profile_id);

-- ----------------------------------------------------------------------------
-- Storage :: avatars bucket (public read, owner-scoped writes)
-- ----------------------------------------------------------------------------
-- Avatars are stored under a folder named after the user's id:
--   avatars/<auth.uid()>/<filename>
-- so the first path segment must equal the uploader's uid.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_read_public"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
