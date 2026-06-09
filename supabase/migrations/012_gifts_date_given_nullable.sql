-- Allow date_given to be null for planned gifts
ALTER TABLE gifts ALTER COLUMN date_given DROP NOT NULL;
