-- Remove incorrectly-dated auto-generated occasions for the 4 algorithmically-calculated holidays.
-- ensureSystemOccasions will recreate them with the correct calculated dates on next page load.
DELETE FROM occasions
WHERE holiday_id IN (
  SELECT id FROM holidays
  WHERE name IN ('Mother''s Day', 'Father''s Day', 'Thanksgiving', 'Easter')
  AND is_system = true
)
AND EXTRACT(YEAR FROM date::date) IN (2026, 2027);
