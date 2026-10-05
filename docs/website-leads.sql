CREATE TABLE IF NOT EXISTS website_leads (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text,
  phone text,
  niche text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
