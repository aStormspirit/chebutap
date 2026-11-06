-- Игроки, которые открывали Mini App. Пишет только Edge Function `track-visit` (service role).
create table if not exists public.players (
  telegram_id   bigint primary key,
  username      text,
  first_name    text,
  last_name     text,
  language_code text,
  is_premium    boolean not null default false,
  first_seen    timestamptz not null default now(),
  last_seen     timestamptz not null default now(),
  visits        integer not null default 1
);

create index if not exists players_last_seen_idx on public.players (last_seen desc);

-- RLS без политик: anon/authenticated не читают и не пишут, service role обходит RLS.
alter table public.players enable row level security;

-- Атомарный upsert визита: при повторном заходе обновляет профиль, last_seen и счётчик.
create or replace function public.track_player_visit(
  p_telegram_id bigint,
  p_username text,
  p_first_name text,
  p_last_name text,
  p_language_code text,
  p_is_premium boolean
) returns void
language sql
security definer
set search_path = public
as $$
  insert into public.players as p
    (telegram_id, username, first_name, last_name, language_code, is_premium)
  values
    (p_telegram_id, p_username, p_first_name, p_last_name, p_language_code, coalesce(p_is_premium, false))
  on conflict (telegram_id) do update set
    username      = excluded.username,
    first_name    = excluded.first_name,
    last_name     = excluded.last_name,
    language_code = excluded.language_code,
    is_premium    = excluded.is_premium,
    last_seen     = now(),
    visits        = p.visits + 1;
$$;

revoke all on function public.track_player_visit(bigint, text, text, text, text, boolean) from public, anon, authenticated;
grant execute on function public.track_player_visit(bigint, text, text, text, text, boolean) to service_role;
