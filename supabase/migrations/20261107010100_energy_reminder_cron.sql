-- Раз в минуту вызывает Edge Function `notify-energy`.
-- Перед применением положи в Vault два секрета (Dashboard → Project Settings → Vault или SQL):
--   select vault.create_secret('https://<ref>.supabase.co/functions/v1/notify-energy', 'notify_energy_url');
--   select vault.create_secret('<тот же CRON_SECRET, что у функции>', 'notify_energy_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('notify-energy')
where exists (select 1 from cron.job where jobname = 'notify-energy');

select cron.schedule(
  'notify-energy',
  '* * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'notify_energy_url'),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_energy_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);
