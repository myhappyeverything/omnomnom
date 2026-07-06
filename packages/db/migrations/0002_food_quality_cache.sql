-- Caches the AI food-quality assessment for a user's day so the nutrition
-- score never re-calls the model unless that day's logged meals actually
-- changed. Past days are immutable once logged, so this is effectively a
-- permanent cache — only "today" ever gets recomputed, and only when its
-- meals_hash no longer matches what's stored.
CREATE TABLE food_quality_cache (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  date_key TEXT NOT NULL, -- 'YYYY-MM-DD' in the user's local time, as computed client-side
  meals_hash TEXT NOT NULL,
  overall_score REAL NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
  meal_scores_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_food_quality_cache_user_date ON food_quality_cache (user_id, date_key);
