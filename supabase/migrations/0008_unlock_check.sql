-- ============================================================================
-- OnlyLinks :: unlock check RPC
-- Lets the click tracker and unlock page verify a visitor paid without
-- exposing all unlock rows via public SELECT policies.
-- ============================================================================

create or replace function public.has_link_unlock(
  p_link_id uuid,
  p_visitor_id text
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.link_unlocks
    where link_id = p_link_id
      and visitor_id is not null
      and visitor_id = p_visitor_id
  );
$$;

grant execute on function public.has_link_unlock(uuid, text) to anon, authenticated;
