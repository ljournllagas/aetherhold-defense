-- Rebuild the table so legacy nullable run IDs become a durable NOT NULL contract.
CREATE TABLE scores_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  highest_wave INTEGER NOT NULL CHECK (highest_wave >= 0 AND highest_wave <= 500),
  final_score INTEGER NOT NULL CHECK (final_score >= 0 AND final_score <= 10000000),
  enemies_killed INTEGER NOT NULL DEFAULT 0,
  bosses_killed INTEGER NOT NULL DEFAULT 0,
  remaining_lives INTEGER NOT NULL DEFAULT 0,
  game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  run_id TEXT NOT NULL UNIQUE CHECK (length(run_id) BETWEEN 8 AND 64 AND run_id = trim(run_id)),
  game_version TEXT NOT NULL,
  score_version INTEGER NOT NULL
);

WITH RECURSIVE
valid_run_ids(run_id) AS (
  SELECT run_id
  FROM scores
  WHERE run_id IS NOT NULL
    AND length(trim(run_id)) BETWEEN 8 AND 64
    AND run_id = trim(run_id)
),
legacy_candidates(id, suffix, run_id) AS (
  SELECT id, 0, 'legacy-' || id
  FROM scores
  WHERE run_id IS NULL
    OR length(trim(run_id)) NOT BETWEEN 8 AND 64
    OR run_id != trim(run_id)
  UNION ALL
  SELECT candidate.id, candidate.suffix + 1,
         'legacy-' || candidate.id || '-' || (candidate.suffix + 1)
  FROM legacy_candidates AS candidate
  WHERE EXISTS (
    SELECT 1 FROM valid_run_ids AS existing
    WHERE existing.run_id = candidate.run_id
  )
),
legacy_backfills(id, run_id) AS (
  SELECT candidate.id, candidate.run_id
  FROM legacy_candidates AS candidate
  WHERE NOT EXISTS (
    SELECT 1 FROM valid_run_ids AS existing
    WHERE existing.run_id = candidate.run_id
  )
)
INSERT INTO scores_new (
  id, player_name, difficulty, highest_wave, final_score, enemies_killed,
  bosses_killed, remaining_lives, game_duration_seconds, created_at, run_id,
  game_version, score_version
)
SELECT
  id, player_name, difficulty, highest_wave, final_score, enemies_killed,
  bosses_killed, remaining_lives, game_duration_seconds, created_at,
  CASE WHEN run_id IS NULL OR length(trim(run_id)) NOT BETWEEN 8 AND 64 OR run_id != trim(run_id)
    THEN (SELECT backfill.run_id FROM legacy_backfills AS backfill WHERE backfill.id = scores.id)
    ELSE run_id
  END,
  game_version, score_version
FROM scores;

DROP TABLE scores;
ALTER TABLE scores_new RENAME TO scores;

CREATE INDEX idx_scores_difficulty_wave_score ON scores (difficulty, highest_wave DESC, final_score DESC);
CREATE INDEX idx_scores_wave_score ON scores (highest_wave DESC, final_score DESC);
CREATE INDEX idx_scores_version_wave_score ON scores (score_version, highest_wave DESC, final_score DESC);
CREATE INDEX idx_scores_version_difficulty ON scores (score_version, difficulty, highest_wave DESC, final_score DESC);
