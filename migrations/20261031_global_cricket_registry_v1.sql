-- Scoring Heroes Global Cricket Registry V1
-- Additive PostgreSQL schema. Run only after backup and review.
BEGIN;
CREATE TABLE IF NOT EXISTS registry_entities (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('country','territory','board','association','competition','season','club','team','player','venue')),
  canonical_name TEXT NOT NULL,
  country_iso2 CHAR(2),
  parent_id BIGINT REFERENCES registry_entities(id) ON DELETE RESTRICT,
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending','verified','rejected')),
  source_url TEXT,
  source_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (parent_id IS NULL OR parent_id <> id)
);
CREATE INDEX IF NOT EXISTS registry_entities_type_country_idx ON registry_entities(entity_type,country_iso2);
CREATE INDEX IF NOT EXISTS registry_entities_parent_idx ON registry_entities(parent_id);
CREATE INDEX IF NOT EXISTS registry_entities_name_lookup_idx ON registry_entities(lower(canonical_name));
CREATE TABLE IF NOT EXISTS registry_aliases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity_id BIGINT NOT NULL REFERENCES registry_entities(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  alias_kind TEXT NOT NULL DEFAULT 'alternate' CHECK (alias_kind IN ('alternate','historical','abbreviation','translation')),
  valid_from DATE,
  valid_to DATE,
  source_url TEXT,
  UNIQUE (entity_id, alias_name, alias_kind)
);
CREATE TABLE IF NOT EXISTS registry_source_rows (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_version TEXT NOT NULL,
  source_sheet TEXT NOT NULL,
  source_row TEXT NOT NULL,
  raw_payload JSONB NOT NULL,
  entity_id BIGINT REFERENCES registry_entities(id) ON DELETE SET NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','mapped','metadata','rejected')),
  UNIQUE(source_version,source_sheet,source_row)
);
CREATE TABLE IF NOT EXISTS registry_review_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  source_row_id BIGINT REFERENCES registry_source_rows(id) ON DELETE SET NULL,
  entity_id BIGINT REFERENCES registry_entities(id) ON DELETE SET NULL,
  decision TEXT NOT NULL,
  reviewer TEXT,
  note TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
