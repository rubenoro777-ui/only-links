-- ============================================================================
-- OnlyLinks :: archive/hide links
-- Adds archived_at to links so owners can hide a link without deleting it.
-- Archived links are excluded from the public page; click history is preserved.
-- ============================================================================

alter table public.links
  add column if not exists archived_at timestamptz;

create index if not exists links_archived_at_idx
  on public.links (archived_at)
  where archived_at is not null;
