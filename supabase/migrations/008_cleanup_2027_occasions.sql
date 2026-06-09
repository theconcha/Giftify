-- Remove all auto-generated 2027 occasions so the rolling logic can recreate only the correct ones
DELETE FROM occasions
WHERE holiday_id IN (
  SELECT id FROM holidays WHERE is_system = true AND anchor_month IS NOT NULL
)
AND EXTRACT(YEAR FROM date::date) = 2027;
