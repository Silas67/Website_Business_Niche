CREATE TABLE IF NOT EXISTS website_leads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  business_name text,
  email text,
  phone text,
  niche text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE website_leads
  ADD COLUMN IF NOT EXISTS business_name text;
