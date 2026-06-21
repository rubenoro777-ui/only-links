-- ============================================================================
-- OnlyLinks :: owner-configured access token expiry
-- Lets link owners choose how long a paid handoff token stays valid.
-- ============================================================================

alter table public.links
  add column if not exists access_ttl_minutes integer not null default 30;

alter table public.links
  drop constraint if exists links_access_ttl_minutes_check;

alter table public.links
  add constraint links_access_ttl_minutes_check
  check (access_ttl_minutes >= 5 and access_ttl_minutes <= 10080);
