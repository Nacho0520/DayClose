-- ════════════════════════════════════════════════════════════
-- DayClose — Configuración del Cron de Notificaciones Nocturnas
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ════════════════════════════════════════════════════════════

-- 1. Activar la extensión pg_cron (si no está activa ya)
create extension if not exists pg_cron;

-- 2. Activar pg_net para hacer llamadas HTTP desde SQL (necesario para el cron)
create extension if not exists pg_net;

-- 3. Eliminar el job anterior si existía (para reconfigurarlo limpio)
select cron.unschedule('daily-review-notification');

-- 4. Programar el cron a las 21:00 UTC
--    → 22:00 hora España (CET, invierno — oct-mar)
--    → 23:00 hora España (CEST, verano — mar-oct)
select cron.schedule(
  'daily-review-notification',
  '0 21 * * *',
  $$
  select net.http_post(
    url     := 'https://yqfypabudpepxutryxtb.supabase.co/functions/v1/cron-notifications',
    headers := '{"Authorization": "Bearer dayclose_secreto_2026_x123", "Content-Type": "application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- 5. Verificar que el job quedó creado correctamente
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'daily-review-notification';
