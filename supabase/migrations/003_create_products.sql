-- Products table
CREATE TABLE products (
  id           UUID          DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID          REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT          NOT NULL,
  url          TEXT,
  sku          TEXT,
  photo_url    TEXT,
  description  TEXT,
  price        NUMERIC(10,2),
  categories   TEXT[]        DEFAULT '{}' NOT NULL,
  is_favorited BOOLEAN       DEFAULT false NOT NULL,
  is_archived  BOOLEAN       DEFAULT false NOT NULL,
  created_at   TIMESTAMPTZ   DEFAULT now() NOT NULL,
  updated_at   TIMESTAMPTZ   DEFAULT now() NOT NULL
);

-- Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select their own products"
  ON products FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can insert their own products"
  ON products FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update their own products"
  ON products FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete their own products"
  ON products FOR DELETE USING (auth.uid() = user_id);

-- Reuse the update_updated_at function created in migration 001
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
