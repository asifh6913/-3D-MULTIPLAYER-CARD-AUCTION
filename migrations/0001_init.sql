-- Card Auction - saved players (profile blob) + leaderboard source of truth.
-- One row per player. The blob is the same JSON the local server writes to
-- cardauction-data.json, so a save can be moved between local and cloud.

CREATE TABLE IF NOT EXISTS profiles (
  pid        TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_updated ON profiles (updated_at DESC);