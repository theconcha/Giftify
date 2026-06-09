-- Fix Diwali 2026: correct date is November 8, 2026 (not the October 20 placeholder)
UPDATE occasions
SET date = '2026-11-08', name = 'Diwali 2026'
WHERE holiday_id = (SELECT id FROM holidays WHERE name = 'Diwali' AND is_system = true)
AND EXTRACT(YEAR FROM date::date) = 2026;

-- Fix Hanukkah 2026: correct start date is December 4, 2026 (not the December 25 placeholder)
UPDATE occasions
SET date = '2026-12-04', name = 'Hanukkah 2026'
WHERE holiday_id = (SELECT id FROM holidays WHERE name = 'Hanukkah' AND is_system = true)
AND EXTRACT(YEAR FROM date::date) = 2026;
