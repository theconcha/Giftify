-- ============================================================
-- HOLIDAYS
-- ============================================================
CREATE TABLE holidays (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT        NOT NULL,
  icon_url     TEXT,
  anchor_month INTEGER     CHECK (anchor_month BETWEEN 1 AND 12),
  anchor_day   INTEGER     CHECK (anchor_day BETWEEN 1 AND 31),
  is_system    BOOLEAN     DEFAULT false NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

-- All authenticated users can view system holidays + their own custom holidays
CREATE POLICY "users can view system and their own holidays"
  ON holidays FOR SELECT TO authenticated
  USING (user_id IS NULL OR user_id = auth.uid());

-- Users can only create their own custom holidays
CREATE POLICY "users can insert their own holidays"
  ON holidays FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND is_system = false);

-- Users can only update their own custom holidays
CREATE POLICY "users can update their own holidays"
  ON holidays FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND is_system = false);

-- Users can only delete their own custom holidays
CREATE POLICY "users can delete their own holidays"
  ON holidays FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND is_system = false);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.holidays TO authenticated;

-- ============================================================
-- PRE-LOAD 15 SYSTEM HOLIDAYS
-- user_id is NULL and is_system is true for all system holidays
-- ============================================================
INSERT INTO holidays (name, anchor_month, anchor_day, is_system) VALUES
  ('Birthday',               NULL, NULL, true),  -- per-person, no anchor
  ('Christmas',              12,   25,   true),
  ('Valentine''s Day',       2,    14,   true),
  ('Mother''s Day',          5,    11,   true),  -- 2nd Sunday placeholder
  ('Father''s Day',          6,    15,   true),  -- 3rd Sunday placeholder
  ('Hanukkah',               12,   25,   true),  -- shifts yearly, placeholder
  ('Diwali',                 10,   20,   true),  -- shifts yearly, placeholder
  ('Thanksgiving',           11,   27,   true),  -- 4th Thursday placeholder
  ('Easter',                 4,    1,    true),  -- shifts yearly, placeholder
  ('Passover',               4,    1,    true),  -- shifts yearly, placeholder
  ('Eid al-Fitr',            NULL, NULL, true),  -- user sets date per year
  ('New Year''s',            1,    1,    true),
  ('Wedding / Anniversary',  NULL, NULL, true),  -- user sets date
  ('Baby Shower / New Baby', NULL, NULL, true),  -- user sets date
  ('Graduation',             NULL, NULL, true);  -- user sets date

-- ============================================================
-- OCCASIONS
-- ============================================================
CREATE TABLE occasions (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  holiday_id  UUID        REFERENCES holidays(id) ON DELETE SET NULL,
  name        TEXT        NOT NULL,
  date        DATE        NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE occasions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select their own occasions"
  ON occasions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own occasions"
  ON occasions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their own occasions"
  ON occasions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete their own occasions"
  ON occasions FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.occasions TO authenticated;

CREATE TRIGGER occasions_updated_at
  BEFORE UPDATE ON occasions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- OCCASION_PEOPLE (junction table)
-- ============================================================
CREATE TABLE occasion_people (
  occasion_id UUID REFERENCES occasions(id) ON DELETE CASCADE NOT NULL,
  person_id   UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (occasion_id, person_id)
);

ALTER TABLE occasion_people ENABLE ROW LEVEL SECURITY;

-- Access is based on whether the occasion belongs to the current user
CREATE POLICY "users can manage their own occasion people"
  ON occasion_people FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM occasions
      WHERE occasions.id = occasion_id
      AND occasions.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.occasion_people TO authenticated;
