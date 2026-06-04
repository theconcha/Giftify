-- People table
CREATE TABLE people (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  birthday_month  INTEGER     CHECK (birthday_month BETWEEN 1 AND 12),
  birthday_day    INTEGER     CHECK (birthday_day BETWEEN 1 AND 31),
  birthday_year   INTEGER     CHECK (birthday_year BETWEEN 1900 AND 2100),
  street_address  TEXT,
  email_address   TEXT,
  photo_url       TEXT,
  gender          TEXT        CHECK (gender IN ('male', 'female', 'non_binary', 'other')),
  pronouns        TEXT        CHECK (pronouns IN ('he_him', 'she_her', 'he_they', 'she_they', 'they_them', 'other')),
  religion        TEXT        CHECK (religion IN ('christian', 'jewish', 'islam', 'hinduism', 'buddhism', 'confucianism', 'taoism', 'shinto', 'atheist', 'agnostic', 'jainism', 'sikhism', 'other')),
  is_archived     BOOLEAN     DEFAULT false NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Row Level Security: users can only access their own people
ALTER TABLE people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select their own people"
  ON people FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own people"
  ON people FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their own people"
  ON people FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete their own people"
  ON people FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at on every change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER people_updated_at
  BEFORE UPDATE ON people
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
