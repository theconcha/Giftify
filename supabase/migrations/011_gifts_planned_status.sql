-- Add status and planned_date to gifts table
-- All existing gifts default to 'given' (already recorded)
ALTER TABLE gifts
  ADD COLUMN status TEXT NOT NULL DEFAULT 'given'
    CHECK (status IN ('planned', 'given')),
  ADD COLUMN planned_date DATE;
