-- ============================================================================
-- OnlyLinks :: analytics enrichment
-- Adds visitor fingerprint + geo + device/browser/os to click_events
-- Adds visitor fingerprint + referrer + geo + device to page_views
-- ============================================================================
-- All statements are idempotent (add column IF NOT EXISTS).
-- ----------------------------------------------------------------------------

-- click_events enrichment ---------------------------------------------------

alter table public.click_events
  add column if not exists visitor_id   text,
  add column if not exists country      text,
  add column if not exists city         text,
  add column if not exists device_type  text,
  add column if not exists browser      text,
  add column if not exists os           text;

-- page_views enrichment -----------------------------------------------------

alter table public.page_views
  add column if not exists visitor_id   text,
  add column if not exists referrer     text,
  add column if not exists country      text,
  add column if not exists device_type  text;

-- indexes for common analytics queries --------------------------------------

create index if not exists click_events_visitor_id_idx
  on public.click_events (visitor_id);

create index if not exists click_events_country_idx
  on public.click_events (country);

create index if not exists page_views_visitor_id_idx
  on public.page_views (visitor_id);
