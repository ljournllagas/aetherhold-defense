-- 0002: run identity + score-era versioning (SPEC §29-§31, §40).
-- run_id prevents duplicate submissions; score_version keeps leaderboard eras comparable.
-- Historical submissions predate the current scoring rules and remain in legacy era 0.
ALTER TABLE scores ADD COLUMN run_id TEXT;
ALTER TABLE scores ADD COLUMN game_version TEXT NOT NULL DEFAULT '0.1.0';
ALTER TABLE scores ADD COLUMN score_version INTEGER NOT NULL DEFAULT 0;

-- Backfill run_id for any legacy rows (migrations run before new code writes).
UPDATE scores SET run_id = 'legacy-' || id WHERE run_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_run_id ON scores (run_id);
CREATE INDEX IF NOT EXISTS idx_scores_version_wave_score ON scores (score_version, highest_wave DESC, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_version_difficulty ON scores (score_version, difficulty, highest_wave DESC, final_score DESC);
