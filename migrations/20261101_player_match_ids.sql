-- Scoring Heroes permanent Player ID / Match ID (additive, NOT applied by the runtime).
-- Runtime today stores the same data in db.idReg (JSON file / Neon kv) via ids.mjs.
-- Formats: SH-P-YYYYMM-NNNNNN (monthly seq), SH-M-YYYYMMDD-NNNNNN (daily seq). IDs are never recycled.
CREATE TABLE IF NOT EXISTS id_sequences (
  seq_type text NOT NULL CHECK (seq_type IN ('player','match')),
  period   text NOT NULL,            -- YYYYMM for players, YYYYMMDD for matches
  last_value integer NOT NULL DEFAULT 0 CHECK (last_value BETWEEN 0 AND 999999),
  PRIMARY KEY (seq_type, period)
);
CREATE TABLE IF NOT EXISTS players (
  id bigserial PRIMARY KEY,
  public_player_id text NOT NULL UNIQUE CHECK (public_player_id ~ '^SH-P-[0-9]{6}-[0-9]{6}$'),
  identity_key text NOT NULL UNIQUE,  -- ph:<last10> | em:<email> | ref:<sport>:<ref>
  full_name text, verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS matches (
  id bigserial PRIMARY KEY,
  public_match_id text NOT NULL UNIQUE CHECK (public_match_id ~ '^SH-M-[0-9]{8}-[0-9]{6}$'),
  sport text NOT NULL, client_ref text NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', scheduled_date date, tournament_id text, season text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sport, client_ref)
);
CREATE TABLE IF NOT EXISTS external_identity_mapping (
  provider text NOT NULL, external_id text NOT NULL, entity_type text NOT NULL CHECK (entity_type IN ('player','match')),
  public_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, entity_type, external_id)
);
CREATE TABLE IF NOT EXISTS id_audit (
  id bigserial PRIMARY KEY, at timestamptz NOT NULL DEFAULT now(), action text NOT NULL, public_id text, detail jsonb
);
-- Atomic allocation: INSERT INTO id_sequences VALUES ($1,$2,1) ON CONFLICT (seq_type,period)
--   DO UPDATE SET last_value = id_sequences.last_value + 1 RETURNING last_value;
