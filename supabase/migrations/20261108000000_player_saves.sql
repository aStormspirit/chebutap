-- Облачное сохранение игры и счётчик обслуженных клиентов. Пишет только Edge Function `save-progress` (service role).
alter table public.players
  add column if not exists save             jsonb,
  add column if not exists save_rev         integer not null default 0,
  add column if not exists save_updated_at  timestamptz,
  add column if not exists customers_served integer not null default 0;

comment on column public.players.save is 'Сохранение игры: { v, saveId, game, kitchen, tutorialDone }';
comment on column public.players.save_rev is 'Номер версии сохранения; запись принимается только поверх текущей версии';
comment on column public.players.customers_served is 'Обслужено клиентов с последнего сброса прогресса';

create or replace function public.load_player_save(p_telegram_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select jsonb_build_object('save', p.save, 'rev', p.save_rev, 'served', p.customers_served)
       from public.players p where p.telegram_id = p_telegram_id),
    jsonb_build_object('save', null, 'rev', 0, 'served', 0)
  );
$$;

-- Запись сохранения поверх версии p_base_rev. Если в облаке уже другая версия (игра на другом устройстве),
-- ничего не меняет и возвращает облачное сохранение. Счётчик клиентов не уменьшается, кроме сброса прогресса.
create or replace function public.store_player_save(
  p_telegram_id bigint,
  p_base_rev integer,
  p_save jsonb,
  p_served integer,
  p_reset boolean
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cur public.players%rowtype;
  served integer := greatest(coalesce(p_served, 0), 0);
begin
  insert into public.players (telegram_id) values (p_telegram_id) on conflict (telegram_id) do nothing;
  select * into cur from public.players where telegram_id = p_telegram_id for update;

  if cur.save_rev <> p_base_rev then
    return jsonb_build_object('ok', false, 'save', cur.save, 'rev', cur.save_rev, 'served', cur.customers_served);
  end if;

  update public.players set
    save = p_save,
    save_rev = cur.save_rev + 1,
    save_updated_at = now(),
    customers_served = case when coalesce(p_reset, false) then served else greatest(cur.customers_served, served) end
  where telegram_id = p_telegram_id
  returning * into cur;

  return jsonb_build_object('ok', true, 'rev', cur.save_rev, 'served', cur.customers_served);
end;
$$;

revoke all on function public.load_player_save(bigint) from public, anon, authenticated;
grant execute on function public.load_player_save(bigint) to service_role;
revoke all on function public.store_player_save(bigint, integer, jsonb, integer, boolean) from public, anon, authenticated;
grant execute on function public.store_player_save(bigint, integer, jsonb, integer, boolean) to service_role;
