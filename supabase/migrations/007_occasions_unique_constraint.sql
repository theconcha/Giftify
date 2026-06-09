-- Delete any existing duplicates first, keeping the earliest created record
DELETE FROM occasions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, holiday_id, date) id
  FROM occasions
  WHERE holiday_id IS NOT NULL
  ORDER BY user_id, holiday_id, date, created_at ASC
)
AND holiday_id IS NOT NULL;

-- Add a partial unique index: one occasion per user per holiday per date
-- Only applies when holiday_id is not null (one-off occasions are unrestricted)
CREATE UNIQUE INDEX occasions_user_holiday_date_unique
  ON occasions (user_id, holiday_id, date)
  WHERE holiday_id IS NOT NULL;
