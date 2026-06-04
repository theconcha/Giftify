-- Remove strict CHECK constraints to allow free-text entries
-- Gender, pronouns, and religion now accept any text value
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_gender_check;
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_pronouns_check;
ALTER TABLE people DROP CONSTRAINT IF EXISTS people_religion_check;
