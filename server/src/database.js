import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_PATH = join(__dirname, '..', 'data', 'math-games.db');

// Ensure data directory exists
import { mkdirSync } from 'fs';
mkdirSync(join(__dirname, '..', 'data'), { recursive: true });

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize database schema
function initializeDatabase() {
  db.exec(`
    -- Players table: stores core player identity and preferences
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT 'Player',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_played_date TEXT,
      streak INTEGER NOT NULL DEFAULT 0,
      sound_enabled INTEGER NOT NULL DEFAULT 1,
      practice_mode INTEGER NOT NULL DEFAULT 0,
      language TEXT NOT NULL DEFAULT 'vi',
      version INTEGER NOT NULL DEFAULT 2
    );

    -- Player stats table: tracks game statistics
    CREATE TABLE IF NOT EXISTS player_stats (
      player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
      total_games_played INTEGER NOT NULL DEFAULT 0,
      total_puzzles_solved INTEGER NOT NULL DEFAULT 0,
      total_wins INTEGER NOT NULL DEFAULT 0,
      magic_graph_solved INTEGER NOT NULL DEFAULT 0,
      sequence_race_wins INTEGER NOT NULL DEFAULT 0,
      shape_architect_built INTEGER NOT NULL DEFAULT 0,
      magic_graph_fastest REAL,
      sequence_race_fastest REAL,
      shape_architect_fastest REAL
    );

    -- Achievements table: tracks unlocked achievements per player
    CREATE TABLE IF NOT EXISTS player_achievements (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      achievement_id TEXT NOT NULL,
      unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (player_id, achievement_id)
    );

    -- Game progress table: tracks per-game level completion
    CREATE TABLE IF NOT EXISTS game_progress (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      level_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      best_time REAL,
      completed_at TEXT,
      PRIMARY KEY (player_id, game_id, level_id)
    );

    -- Daily challenges table: tracks daily challenge completions
    CREATE TABLE IF NOT EXISTS daily_challenges (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      game_id TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      time_seconds REAL,
      completed_at TEXT,
      PRIMARY KEY (player_id, date, game_id)
    );

    -- Daily streaks table: per-game streak tracking
    CREATE TABLE IF NOT EXISTS daily_streaks (
      player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
      game_id TEXT NOT NULL,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_completed_date TEXT,
      PRIMARY KEY (player_id, game_id)
    );

    -- Create indexes for common queries
    CREATE INDEX IF NOT EXISTS idx_player_achievements_player ON player_achievements(player_id);
    CREATE INDEX IF NOT EXISTS idx_game_progress_player ON game_progress(player_id);
    CREATE INDEX IF NOT EXISTS idx_daily_challenges_player_date ON daily_challenges(player_id, date);
  `);

  console.log('Database initialized at:', DB_PATH);
}

// Initialize on import
initializeDatabase();

export default db;
export { DB_PATH };
