-- Напоминание «энергия пополнилась» в боте.
-- Игра при сворачивании сообщает, через сколько секунд энергия станет полной (`energy-schedule`),
-- при возвращении — отменяет. Раз в минуту pg_cron вызывает `notify-energy`, который забирает
-- готовые напоминания (`claim_energy_reminders`) и шлёт сообщение через Bot API.

alter table public.players
  add column if not exists energy_full_at     timestamptz,
  add column if not exists energy_notified_at timestamptz,
  add column if not exists bot_blocked        boolean not null default false;

create index if not exists players_energy_full_at_idx
  on public.players (energy_full_at)
  where energy_full_at is not null;

-- Ставит (p_full_in_seconds > 0) или отменяет (null) напоминание. Игрок заходил — значит, бот ему снова доступен.
create or replace function public.set_energy_reminder(
  p_telegram_id bigint,
  p_full_in_seconds integer
) returns void
language sql
security definer
set search_path = public
as $$
  update public.players set
    energy_full_at = case
      when p_full_in_seconds is null or p_full_in_seconds <= 0 then null
      else now() + make_interval(secs => least(p_full_in_seconds, 7 * 24 * 3600))
    end,
    bot_blocked = false
  where telegram_id = p_telegram_id;
$$;

-- Атомарно забирает напоминания, которым пора: энергия полная, бот не заблокирован,
-- прошлое напоминание было не раньше чем 6 часов назад. Напоминание снимается в любом случае,
-- поэтому повторно за этот уход не придёт.
create or replace function public.claim_energy_reminders(p_limit integer default 500)
returns table (telegram_id bigint, first_name text, language_code text)
language sql
security definer
set search_path = public
as $$
  with due as (
    select
      p.telegram_id,
      (not p.bot_blocked
        and (p.energy_notified_at is null or p.energy_notified_at <= now() - interval '6 hours')) as send
    from public.players p
    where p.energy_full_at is not null and p.energy_full_at <= now()
    order by p.energy_full_at
    limit p_limit
    for update skip locked
  ),
  upd as (
    update public.players p set
      energy_full_at = null,
      energy_notified_at = case when due.send then now() else p.energy_notified_at end
    from due
    where p.telegram_id = due.telegram_id
    returning p.telegram_id, p.first_name, p.language_code, due.send
  )
  select upd.telegram_id, upd.first_name, upd.language_code from upd where upd.send;
$$;

-- Пометка тех, кто заблокировал бота (Telegram ответил 403).
create or replace function public.mark_bot_blocked(p_ids bigint[])
returns void
language sql
security definer
set search_path = public
as $$
  update public.players set bot_blocked = true where telegram_id = any(p_ids);
$$;

revoke all on function public.set_energy_reminder(bigint, integer) from public, anon, authenticated;
revoke all on function public.claim_energy_reminders(integer) from public, anon, authenticated;
revoke all on function public.mark_bot_blocked(bigint[]) from public, anon, authenticated;
grant execute on function public.set_energy_reminder(bigint, integer) to service_role;
grant execute on function public.claim_energy_reminders(integer) to service_role;
grant execute on function public.mark_bot_blocked(bigint[]) to service_role;
