CREATE TABLE IF NOT EXISTS scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
  highest_wave INTEGER NOT NULL CHECK (highest_wave >= 0 AND highest_wave <= 500),
  final_score INTEGER NOT NULL CHECK (final_score >= 0 AND final_score <= 10000000),
  enemies_killed INTEGER NOT NULL DEFAULT 0,
  bosses_killed INTEGER NOT NULL DEFAULT 0,
  remaining_lives INTEGER NOT NULL DEFAULT 0,
  game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_difficulty_wave_score ON scores (difficulty, highest_wave DESC, final_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_wave_score ON scores (highest_wave DESC, final_score DESC);
