-- Gifts table
CREATE TABLE gifts (
  id               UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name             TEXT        NOT NULL,
  product_id       UUID        REFERENCES products(id) ON DELETE SET NULL,
  free_text        TEXT,
  occasion_id      UUID        REFERENCES occasions(id) ON DELETE SET NULL,
  date_given       DATE        NOT NULL DEFAULT CURRENT_DATE,
  message          TEXT,
  custom_photo_url TEXT,
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select their own gifts"
  ON gifts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own gifts"
  ON gifts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their own gifts"
  ON gifts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete their own gifts"
  ON gifts FOR DELETE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gifts TO authenticated;

CREATE TRIGGER gifts_updated_at
  BEFORE UPDATE ON gifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Gift recipients junction table
CREATE TABLE gift_recipients (
  gift_id   UUID REFERENCES gifts(id) ON DELETE CASCADE NOT NULL,
  person_id UUID REFERENCES people(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (gift_id, person_id)
);

ALTER TABLE gift_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage their own gift recipients"
  ON gift_recipients FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM gifts
      WHERE gifts.id = gift_id
      AND gifts.user_id = auth.uid()
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gift_recipients TO authenticated;
