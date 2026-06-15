-- 0002_socials.sql
-- Additive migration: store a profile's social icon links.
--
-- `socials` is a JSON array of { "platform": string, "url": string } objects,
-- e.g. [{"platform":"instagram","url":"https://instagram.com/me"}].
-- Platform ids and url validity are enforced in application code (see
-- src/lib/socials.ts); the column only guarantees it's a JSON array.
--
-- No changes to existing tables' rows: the default is an empty array, so every
-- existing profile keeps rendering exactly as before.

alter table public.profiles
  add column if not exists socials jsonb not null default '[]'::jsonb;

-- Defensive: ensure the value is always a JSON array, never an object/scalar.
alter table public.profiles
  drop constraint if exists profiles_socials_is_array;
alter table public.profiles
  add constraint profiles_socials_is_array
  check (jsonb_typeof(socials) = 'array');
