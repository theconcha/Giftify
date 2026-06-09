-- Enable pg_net for HTTP calls from pg_cron (pre-enabled on Supabase, this is a no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule send-reminders daily at 9 AM UTC
SELECT cron.schedule(
  'send-reminders-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url     := 'https://mdygugjxdfdfhkkcrbfx.supabase.co/functions/v1/send-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_-VweIwn0HgPP-lPZsYSd7Q_7TEUHTwL"}'::jsonb,
    body    := '{}'::jsonb
  ) AS request_id;
  $$
);
