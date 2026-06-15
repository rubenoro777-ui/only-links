-- Add custom domain field to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS custom_domain text;
