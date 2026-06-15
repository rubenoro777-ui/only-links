-- Custom design columns on profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_bg    text,
  ADD COLUMN IF NOT EXISTS custom_accent text,
  ADD COLUMN IF NOT EXISTS custom_text  text,
  ADD COLUMN IF NOT EXISTS custom_font  text,
  ADD COLUMN IF NOT EXISTS custom_css   text;

-- Link sections
CREATE TABLE IF NOT EXISTS link_sections (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id           uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title                text        NOT NULL,
  position             integer     NOT NULL DEFAULT 0,
  collapsed_by_default boolean     NOT NULL DEFAULT false,
  created_at           timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE link_sections ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'link_sections' AND policyname = 'Users manage own sections'
  ) THEN
    CREATE POLICY "Users manage own sections"
      ON link_sections FOR ALL
      USING  (profile_id = auth.uid())
      WITH CHECK (profile_id = auth.uid());
  END IF;
END $$;

-- section_id FK on links (null = unsectioned)
ALTER TABLE links
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES link_sections(id) ON DELETE SET NULL;
