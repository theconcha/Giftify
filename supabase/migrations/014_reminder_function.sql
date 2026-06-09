CREATE OR REPLACE FUNCTION get_reminder_occasions()
RETURNS TABLE (
  user_id          uuid,
  user_email       text,
  occasion_id      uuid,
  occasion_name    text,
  occasion_date    date,
  days_until       integer,
  person_first_name text,
  person_last_name  text
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  SELECT
    au.id                                          AS user_id,
    au.email                                       AS user_email,
    o.id                                           AS occasion_id,
    o.name                                         AS occasion_name,
    o.date::date                                   AS occasion_date,
    (o.date::date - CURRENT_DATE)::integer         AS days_until,
    p.first_name                                   AS person_first_name,
    p.last_name                                    AS person_last_name
  FROM auth.users au
  INNER JOIN public.notification_settings ns ON ns.user_id = au.id
  INNER JOIN public.occasions o              ON o.user_id  = au.id
  LEFT  JOIN public.occasion_people op       ON op.occasion_id = o.id
  LEFT  JOIN public.people p                 ON p.id = op.person_id
  WHERE
    ARRAY_LENGTH(ns.lead_times, 1) > 0
    AND (o.date::date - CURRENT_DATE)::integer = ANY(ns.lead_times)
  ORDER BY au.id, o.date, p.first_name;
$$;
