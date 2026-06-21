-- ============================================================================
-- OnlyLinks :: Stripe Connect creator payouts
-- Stores connected account state and unlock revenue split metadata.
-- ============================================================================

alter table public.profiles
  add column if not exists stripe_connect_account_id text,
  add column if not exists stripe_connect_charges_enabled boolean not null default false,
  add column if not exists stripe_connect_payouts_enabled boolean not null default false,
  add column if not exists stripe_connect_details_submitted boolean not null default false;

create unique index if not exists profiles_stripe_connect_account_id_idx
  on public.profiles (stripe_connect_account_id)
  where stripe_connect_account_id is not null;

alter table public.link_unlocks
  add column if not exists platform_fee_cents integer,
  add column if not exists creator_net_cents integer;
