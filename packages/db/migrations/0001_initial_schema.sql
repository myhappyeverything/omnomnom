-- Purple — initial D1 schema
-- IDs are app-generated UUIDs (TEXT). Timestamps are ISO-8601 strings (TEXT).
-- Booleans are stored as INTEGER 0/1 (SQLite has no native boolean type).

-- ============================================================================
-- users
-- ============================================================================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  date_of_birth TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  height_cm REAL NOT NULL CHECK (height_cm > 0),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

-- ============================================================================
-- goals
-- One row per goal "version" for a user; is_active marks the current one.
-- Keeping history (rather than updating in place) lets analytics show how
-- targets changed over time and lets weight-goal projections use the goal
-- that was active on any given day.
-- ============================================================================
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('lose_weight', 'maintain', 'gain_weight')),
  starting_weight_kg REAL NOT NULL CHECK (starting_weight_kg > 0),
  target_weight_kg REAL NOT NULL CHECK (target_weight_kg > 0),
  target_duration TEXT NOT NULL CHECK (
    target_duration IN ('2_weeks', '4_weeks', '8_weeks', '12_weeks', 'custom')
  ),
  custom_end_date TEXT,
  activity_level TEXT NOT NULL CHECK (
    activity_level IN (
      'sedentary',
      'lightly_active',
      'moderately_active',
      'very_active',
      'extremely_active'
    )
  ),
  bmr REAL NOT NULL,
  tdee REAL NOT NULL,
  calorie_target REAL NOT NULL,
  calorie_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (calorie_target_overridden IN (0, 1)),
  protein_target_g REAL NOT NULL,
  protein_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (protein_target_overridden IN (0, 1)),
  carbs_target_g REAL NOT NULL,
  carbs_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (carbs_target_overridden IN (0, 1)),
  fat_target_g REAL NOT NULL,
  fat_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (fat_target_overridden IN (0, 1)),
  fibre_target_g REAL NOT NULL,
  fibre_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (fibre_target_overridden IN (0, 1)),
  water_target_ml INTEGER NOT NULL,
  water_target_overridden INTEGER NOT NULL DEFAULT 0 CHECK (water_target_overridden IN (0, 1)),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_goals_user_active ON goals (user_id, is_active);

-- Only one active goal per user at a time.
CREATE UNIQUE INDEX idx_goals_one_active_per_user ON goals (user_id) WHERE is_active = 1;

-- ============================================================================
-- foods
-- Canonical local copy of every food ever looked up or created, regardless of
-- source. Search results are upserted here on first use so they work offline
-- and never require a repeat provider call.
-- ============================================================================
CREATE TABLE foods (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('openfoodfacts', 'usda', 'custom')),
  source_id TEXT,
  barcode TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size REAL NOT NULL CHECK (serving_size > 0),
  serving_unit TEXT NOT NULL,
  calories REAL NOT NULL CHECK (calories >= 0),
  protein_g REAL NOT NULL CHECK (protein_g >= 0),
  carbs_g REAL NOT NULL CHECK (carbs_g >= 0),
  fat_g REAL NOT NULL CHECK (fat_g >= 0),
  fibre_g REAL NOT NULL DEFAULT 0 CHECK (fibre_g >= 0),
  created_by_user_id TEXT REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Prevents the same provider record from being imported twice.
CREATE UNIQUE INDEX idx_foods_source_id ON foods (source, source_id) WHERE source_id IS NOT NULL;
CREATE INDEX idx_foods_name ON foods (name);
CREATE INDEX idx_foods_barcode ON foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_foods_created_by_user ON foods (created_by_user_id) WHERE created_by_user_id IS NOT NULL;

-- ============================================================================
-- recipes
-- ============================================================================
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 1 CHECK (servings > 0),
  instructions TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_recipes_user ON recipes (user_id);

CREATE TABLE recipe_items (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes (id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES foods (id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_recipe_items_recipe ON recipe_items (recipe_id);

-- ============================================================================
-- meals
-- Nutrition totals are denormalised (summed from meal_items at write time) so
-- the dashboard's "today" queries never need to join+aggregate meal_items.
-- ============================================================================
CREATE TABLE meals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_at TEXT NOT NULL,
  photo_r2_key TEXT,
  notes TEXT,
  total_calories REAL NOT NULL DEFAULT 0,
  total_protein_g REAL NOT NULL DEFAULT 0,
  total_carbs_g REAL NOT NULL DEFAULT 0,
  total_fat_g REAL NOT NULL DEFAULT 0,
  total_fibre_g REAL NOT NULL DEFAULT 0,
  client_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_meals_user_logged_at ON meals (user_id, logged_at);
-- Lets offline mutation replay be a safe upsert-by-client_id instead of a blind insert.
CREATE UNIQUE INDEX idx_meals_user_client_id ON meals (user_id, client_id) WHERE client_id IS NOT NULL;

CREATE TABLE meal_items (
  id TEXT PRIMARY KEY,
  meal_id TEXT NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  food_id TEXT REFERENCES foods (id) ON DELETE RESTRICT,
  recipe_id TEXT REFERENCES recipes (id) ON DELETE RESTRICT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  -- Snapshotted at log time so editing a food's nutrition data later never
  -- rewrites the nutritional history of meals already logged.
  calories REAL NOT NULL CHECK (calories >= 0),
  protein_g REAL NOT NULL CHECK (protein_g >= 0),
  carbs_g REAL NOT NULL CHECK (carbs_g >= 0),
  fat_g REAL NOT NULL CHECK (fat_g >= 0),
  fibre_g REAL NOT NULL DEFAULT 0 CHECK (fibre_g >= 0),
  ai_confidence REAL CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1)),
  sort_order INTEGER NOT NULL DEFAULT 0,
  CHECK (food_id IS NOT NULL OR recipe_id IS NOT NULL)
);

CREATE INDEX idx_meal_items_meal ON meal_items (meal_id);

-- ============================================================================
-- weight_logs
-- ============================================================================
CREATE TABLE weight_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  weight_kg REAL NOT NULL CHECK (weight_kg > 0),
  logged_at TEXT NOT NULL,
  notes TEXT,
  client_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_weight_logs_user_logged_at ON weight_logs (user_id, logged_at);
CREATE UNIQUE INDEX idx_weight_logs_user_client_id ON weight_logs (user_id, client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- water_logs
-- ============================================================================
CREATE TABLE water_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TEXT NOT NULL,
  client_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_water_logs_user_logged_at ON water_logs (user_id, logged_at);
CREATE UNIQUE INDEX idx_water_logs_user_client_id ON water_logs (user_id, client_id) WHERE client_id IS NOT NULL;

-- ============================================================================
-- notification_settings (1:1 with users) + custom_reminders (1:many)
-- ============================================================================
CREATE TABLE notification_settings (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  onesignal_player_id TEXT,
  breakfast_reminder_time TEXT,
  lunch_reminder_time TEXT,
  dinner_reminder_time TEXT,
  water_reminder_enabled INTEGER NOT NULL DEFAULT 0 CHECK (water_reminder_enabled IN (0, 1)),
  water_reminder_interval_minutes INTEGER CHECK (
    water_reminder_interval_minutes IS NULL OR water_reminder_interval_minutes > 0
  ),
  weigh_in_reminder_time TEXT,
  weigh_in_reminder_days TEXT NOT NULL DEFAULT '[]',
  quiet_hours_start TEXT,
  quiet_hours_end TEXT,
  weekday_schedule_json TEXT,
  weekend_schedule_json TEXT,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  updated_at TEXT NOT NULL
);

CREATE TABLE custom_reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  time TEXT NOT NULL,
  days_of_week TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_custom_reminders_user ON custom_reminders (user_id);

-- ============================================================================
-- settings (1:1 with users) — app preferences, not nutrition targets.
-- ============================================================================
CREATE TABLE settings (
  user_id TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  unit_system TEXT NOT NULL DEFAULT 'metric' CHECK (unit_system IN ('metric', 'imperial')),
  theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  updated_at TEXT NOT NULL
);

-- ============================================================================
-- recent_foods
-- Serves both "Recent Foods" (order by last_logged_at) and "Frequently
-- Logged Foods" (order by log_count) from a single table.
-- ============================================================================
CREATE TABLE recent_foods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES foods (id) ON DELETE CASCADE,
  last_logged_at TEXT NOT NULL,
  log_count INTEGER NOT NULL DEFAULT 1 CHECK (log_count > 0)
);

CREATE UNIQUE INDEX idx_recent_foods_user_food ON recent_foods (user_id, food_id);
CREATE INDEX idx_recent_foods_user_last_logged ON recent_foods (user_id, last_logged_at);
CREATE INDEX idx_recent_foods_user_log_count ON recent_foods (user_id, log_count);

-- ============================================================================
-- favourite_foods
-- ============================================================================
CREATE TABLE favourite_foods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  food_id TEXT NOT NULL REFERENCES foods (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_favourite_foods_user_food ON favourite_foods (user_id, food_id);

-- ============================================================================
-- ai_cache
-- Keyed by the SHA-256 hash of the (compressed) uploaded image, so a repeat
-- upload of the same photo never triggers a second OpenAI Vision call.
-- ============================================================================
CREATE TABLE ai_cache (
  id TEXT PRIMARY KEY,
  image_hash TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  model TEXT NOT NULL,
  recognized_foods_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_ai_cache_image_hash ON ai_cache (image_hash);

-- ============================================================================
-- refresh_tokens
-- Supports rotating, revocable refresh tokens (Stage 4 — Authentication).
-- ============================================================================
CREATE TABLE refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_refresh_tokens_token_hash ON refresh_tokens (token_hash);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens (user_id);
