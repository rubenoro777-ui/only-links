-- ============================================================================
-- OnlyLinks :: private access grants
-- Adds per-payment access tokens with password-manager-style temporary handoff
-- links and durable cookie access after first redemption.
-- ============================================================================

alter table public.link_unlocks
  add column if not exists access_token text,
  add column if not exists expires_at timestamptz,
  add column if not exists redeemed_at timestamptz,
  add column if not exists revoked_at timestamptz;

update public.link_unlocks
set
  access_token = coalesce(access_token, encode(gen_random_bytes(32), 'hex')),
  expires_at = coalesce(expires_at, created_at + interval '30 minutes'),
  redeemed_at = coalesce(redeemed_at, created_at)
where access_token is null;

alter table public.link_unlocks
  alter column access_token set not null,
  alter column access_token set default encode(gen_random_bytes(32), 'hex'),
  alter column expires_at set not null,
  alter column expires_at set default (now() + interval '30 minutes');

create unique index if not exists link_unlocks_access_token_idx
  on public.link_unlocks (access_token);

create or replace function public.redeem_link_access_token(
  p_link_id uuid,
  p_access_token text
)
returns boolean
language plpgsql
security definer
volatile
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.link_unlocks
  set redeemed_at = now()
  where link_id = p_link_id
    and access_token = p_access_token
    and revoked_at is null
    and redeemed_at is null
    and expires_at > now();

  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

create or replace function public.validate_link_access_cookie(
  p_link_id uuid,
  p_access_token text
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
      and access_token = p_access_token
      and revoked_at is null
      and redeemed_at is not null
  );
$$;

grant execute on function public.redeem_link_access_token(uuid, text) to anon, authenticated;
grant execute on function public.validate_link_access_cookie(uuid, text) to anon, authenticated;

create or replace function public.get_link_access_token_for_visitor(
  p_link_id uuid,
  p_visitor_id text
)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select access_token
  from public.link_unlocks
  where link_id = p_link_id
    and visitor_id = p_visitor_id
    and revoked_at is null
  order by created_at desc
  limit 1;
$$;

grant execute on function public.get_link_access_token_for_visitor(uuid, text) to anon, authenticated;
