BEGIN;

-- B2 hardening for auth sessions and favorites listing.
-- Keep the latest session when duplicate refresh token hashes exist.
WITH ranked_sessions AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY refresh_token_hash
            ORDER BY created_at DESC, id DESC
        ) AS row_num
    FROM sessions
)
DELETE FROM sessions s
USING ranked_sessions r
WHERE s.id = r.id
  AND r.row_num > 1;

CREATE UNIQUE INDEX IF NOT EXISTS sessions_refresh_token_hash_key
    ON sessions (refresh_token_hash);

CREATE INDEX IF NOT EXISTS favorites_user_created_at_idx
    ON favorites (user_id, created_at DESC);

COMMIT;
