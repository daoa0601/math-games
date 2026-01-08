import express from 'express';
import cors from 'cors';
import db from './database.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ============ PLAYER ROUTES ============

// Register a new player or get existing one by ID
app.post('/api/players/login', (req, res) => {
  const { playerId } = req.body;

  if (!playerId || typeof playerId !== 'string' || playerId.trim().length === 0) {
    return res.status(400).json({ error: 'Player ID is required' });
  }

  const id = playerId.trim().toLowerCase();

  // Check if player exists
  const existingPlayer = db.prepare('SELECT id FROM players WHERE id = ?').get(id);

  if (existingPlayer) {
    // Return existing player profile
    const profile = getPlayerProfile(id);
    return res.json({ profile, isNewPlayer: false });
  }

  // Create new player
  const insertPlayer = db.prepare(`
    INSERT INTO players (id, display_name, created_at)
    VALUES (?, ?, datetime('now'))
  `);

  const insertStats = db.prepare(`
    INSERT INTO player_stats (player_id)
    VALUES (?)
  `);

  const transaction = db.transaction(() => {
    insertPlayer.run(id, 'Player');
    insertStats.run(id);
  });

  transaction();

  const profile = getPlayerProfile(id);
  res.json({ profile, isNewPlayer: true });
});

// Get player profile by ID
app.get('/api/players/:playerId', (req, res) => {
  const { playerId } = req.params;
  const profile = getPlayerProfile(playerId);

  if (!profile) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.json(profile);
});

// Update player display name
app.patch('/api/players/:playerId/name', (req, res) => {
  const { playerId } = req.params;
  const { displayName } = req.body;

  if (!displayName || typeof displayName !== 'string') {
    return res.status(400).json({ error: 'Display name is required' });
  }

  const name = displayName.trim().slice(0, 20);

  const result = db.prepare('UPDATE players SET display_name = ? WHERE id = ?').run(name, playerId);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.json({ success: true, displayName: name });
});

// Update player preferences
app.patch('/api/players/:playerId/preferences', (req, res) => {
  const { playerId } = req.params;
  const { soundEnabled, practiceMode, language } = req.body;

  const updates = [];
  const values = [];

  if (soundEnabled !== undefined) {
    updates.push('sound_enabled = ?');
    values.push(soundEnabled ? 1 : 0);
  }
  if (practiceMode !== undefined) {
    updates.push('practice_mode = ?');
    values.push(practiceMode ? 1 : 0);
  }
  if (language !== undefined) {
    updates.push('language = ?');
    values.push(language);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No preferences to update' });
  }

  values.push(playerId);
  const result = db.prepare(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Player not found' });
  }

  res.json({ success: true });
});

// ============ STATS ROUTES ============

// Update player stats (incremental)
app.post('/api/players/:playerId/stats', (req, res) => {
  const { playerId } = req.params;
  const {
    totalGamesPlayed = 0,
    totalPuzzlesSolved = 0,
    totalWins = 0,
    magicGraphSolved = 0,
    sequenceRaceWins = 0,
    shapeArchitectBuilt = 0,
    bestTime
  } = req.body;

  // Check player exists
  const player = db.prepare('SELECT id FROM players WHERE id = ?').get(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  // Get current stats
  const currentStats = db.prepare('SELECT * FROM player_stats WHERE player_id = ?').get(playerId);

  // Calculate new values (incremental updates)
  const newStats = {
    totalGamesPlayed: currentStats.total_games_played + totalGamesPlayed,
    totalPuzzlesSolved: currentStats.total_puzzles_solved + totalPuzzlesSolved,
    totalWins: currentStats.total_wins + totalWins,
    magicGraphSolved: currentStats.magic_graph_solved + magicGraphSolved,
    sequenceRaceWins: currentStats.sequence_race_wins + sequenceRaceWins,
    shapeArchitectBuilt: currentStats.shape_architect_built + shapeArchitectBuilt
  };

  // Handle best times (only update if faster)
  const bestTimes = { ...currentStats };
  if (bestTime) {
    if (bestTime.magicGraphFastest !== undefined) {
      if (!currentStats.magic_graph_fastest || bestTime.magicGraphFastest < currentStats.magic_graph_fastest) {
        bestTimes.magic_graph_fastest = bestTime.magicGraphFastest;
      }
    }
    if (bestTime.sequenceRaceFastest !== undefined) {
      if (!currentStats.sequence_race_fastest || bestTime.sequenceRaceFastest < currentStats.sequence_race_fastest) {
        bestTimes.magic_graph_fastest = bestTime.sequenceRaceFastest;
      }
    }
    if (bestTime.shapeArchitectFastest !== undefined) {
      if (!currentStats.shape_architect_fastest || bestTime.shapeArchitectFastest < currentStats.shape_architect_fastest) {
        bestTimes.shape_architect_fastest = bestTime.shapeArchitectFastest;
      }
    }
  }

  // Update stats
  db.prepare(`
    UPDATE player_stats SET
      total_games_played = ?,
      total_puzzles_solved = ?,
      total_wins = ?,
      magic_graph_solved = ?,
      sequence_race_wins = ?,
      shape_architect_built = ?,
      magic_graph_fastest = ?,
      sequence_race_fastest = ?,
      shape_architect_fastest = ?
    WHERE player_id = ?
  `).run(
    newStats.totalGamesPlayed,
    newStats.totalPuzzlesSolved,
    newStats.totalWins,
    newStats.magicGraphSolved,
    newStats.sequenceRaceWins,
    newStats.shapeArchitectBuilt,
    bestTimes.magic_graph_fastest,
    bestTimes.sequence_race_fastest,
    bestTimes.shape_architect_fastest,
    playerId
  );

  // Calculate and return new rank
  const rank = calculateRank(newStats.totalGamesPlayed, newStats.totalPuzzlesSolved);
  const previousRank = calculateRank(currentStats.total_games_played, currentStats.total_puzzles_solved);

  res.json({
    success: true,
    stats: newStats,
    rank,
    rankedUp: rank !== previousRank,
    previousRank
  });
});

// ============ ACHIEVEMENTS ROUTES ============

// Get player achievements
app.get('/api/players/:playerId/achievements', (req, res) => {
  const { playerId } = req.params;

  const achievements = db.prepare(`
    SELECT achievement_id, unlocked_at
    FROM player_achievements
    WHERE player_id = ?
  `).all(playerId);

  res.json(achievements.map(a => a.achievement_id));
});

// Unlock achievement
app.post('/api/players/:playerId/achievements', (req, res) => {
  const { playerId } = req.params;
  const { achievementId } = req.body;

  if (!achievementId) {
    return res.status(400).json({ error: 'Achievement ID is required' });
  }

  // Check if already unlocked
  const existing = db.prepare(`
    SELECT 1 FROM player_achievements
    WHERE player_id = ? AND achievement_id = ?
  `).get(playerId, achievementId);

  if (existing) {
    return res.json({ success: true, alreadyUnlocked: true });
  }

  db.prepare(`
    INSERT INTO player_achievements (player_id, achievement_id)
    VALUES (?, ?)
  `).run(playerId, achievementId);

  res.json({ success: true, alreadyUnlocked: false });
});

// ============ STREAK ROUTES ============

// Record play session and update streak
app.post('/api/players/:playerId/play-session', (req, res) => {
  const { playerId } = req.params;

  const today = new Date().toISOString().split('T')[0];
  const player = db.prepare('SELECT last_played_date, streak FROM players WHERE id = ?').get(playerId);

  if (!player) {
    return res.status(404).json({ error: 'Player not found' });
  }

  let newStreak = player.streak;
  let streakBroken = false;
  let streakContinued = false;

  if (player.last_played_date !== today) {
    const lastPlayed = player.last_played_date ? new Date(player.last_played_date) : null;
    const todayDate = new Date(today);

    if (lastPlayed) {
      const diffDays = Math.floor((todayDate - lastPlayed) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day - increment streak
        newStreak = player.streak + 1;
        streakContinued = true;
      } else if (diffDays > 1) {
        // Streak broken - reset
        newStreak = 1;
        streakBroken = true;
      }
    } else {
      // First play ever
      newStreak = 1;
    }

    db.prepare('UPDATE players SET last_played_date = ?, streak = ? WHERE id = ?')
      .run(today, newStreak, playerId);
  }

  res.json({
    success: true,
    streak: newStreak,
    streakBroken,
    streakContinued,
    lastPlayedDate: today
  });
});

// ============ GAME PROGRESS ROUTES ============

// Get game progress
app.get('/api/players/:playerId/progress/:gameId', (req, res) => {
  const { playerId, gameId } = req.params;

  const progress = db.prepare(`
    SELECT level_id, completed, best_time, completed_at
    FROM game_progress
    WHERE player_id = ? AND game_id = ?
  `).all(playerId, gameId);

  res.json(progress);
});

// Save level completion
app.post('/api/players/:playerId/progress/:gameId', (req, res) => {
  const { playerId, gameId } = req.params;
  const { levelId, timeSeconds } = req.body;

  if (!levelId) {
    return res.status(400).json({ error: 'Level ID is required' });
  }

  // Check for existing progress
  const existing = db.prepare(`
    SELECT best_time FROM game_progress
    WHERE player_id = ? AND game_id = ? AND level_id = ?
  `).get(playerId, gameId, levelId);

  const isPersonalBest = !existing?.best_time || (timeSeconds && timeSeconds < existing.best_time);
  const bestTime = isPersonalBest ? timeSeconds : existing?.best_time;

  db.prepare(`
    INSERT INTO game_progress (player_id, game_id, level_id, completed, best_time, completed_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
    ON CONFLICT(player_id, game_id, level_id) DO UPDATE SET
      completed = 1,
      best_time = CASE WHEN excluded.best_time < best_time OR best_time IS NULL THEN excluded.best_time ELSE best_time END,
      completed_at = datetime('now')
  `).run(playerId, gameId, levelId, bestTime);

  res.json({
    success: true,
    isPersonalBest,
    bestTime
  });
});

// ============ DAILY CHALLENGE ROUTES ============

// Get daily challenge status
app.get('/api/players/:playerId/daily/:date', (req, res) => {
  const { playerId, date } = req.params;

  const challenges = db.prepare(`
    SELECT game_id, completed, time_seconds, completed_at
    FROM daily_challenges
    WHERE player_id = ? AND date = ?
  `).all(playerId, date);

  const streaks = db.prepare(`
    SELECT game_id, current_streak, longest_streak, last_completed_date
    FROM daily_streaks
    WHERE player_id = ?
  `).all(playerId);

  res.json({ challenges, streaks });
});

// Complete daily challenge
app.post('/api/players/:playerId/daily/:gameId', (req, res) => {
  const { playerId, gameId } = req.params;
  const { timeSeconds } = req.body;

  const today = new Date().toISOString().split('T')[0];

  // Record completion
  db.prepare(`
    INSERT INTO daily_challenges (player_id, date, game_id, completed, time_seconds, completed_at)
    VALUES (?, ?, ?, 1, ?, datetime('now'))
    ON CONFLICT(player_id, date, game_id) DO UPDATE SET
      completed = 1,
      time_seconds = CASE WHEN excluded.time_seconds < time_seconds OR time_seconds IS NULL THEN excluded.time_seconds ELSE time_seconds END,
      completed_at = datetime('now')
  `).run(playerId, today, gameId, timeSeconds);

  // Update streak
  const streak = db.prepare(`
    SELECT current_streak, longest_streak, last_completed_date
    FROM daily_streaks
    WHERE player_id = ? AND game_id = ?
  `).get(playerId, gameId);

  let newCurrentStreak = 1;
  let newLongestStreak = 1;

  if (streak) {
    const lastCompleted = streak.last_completed_date ? new Date(streak.last_completed_date) : null;
    const todayDate = new Date(today);

    if (lastCompleted) {
      const diffDays = Math.floor((todayDate - lastCompleted) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        newCurrentStreak = streak.current_streak + 1;
      } else if (diffDays === 0) {
        // Same day - no change
        newCurrentStreak = streak.current_streak;
      }
      // diffDays > 1 means streak broken, reset to 1
    }
    newLongestStreak = Math.max(streak.longest_streak, newCurrentStreak);
  }

  db.prepare(`
    INSERT INTO daily_streaks (player_id, game_id, current_streak, longest_streak, last_completed_date)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(player_id, game_id) DO UPDATE SET
      current_streak = excluded.current_streak,
      longest_streak = excluded.longest_streak,
      last_completed_date = excluded.last_completed_date
  `).run(playerId, gameId, newCurrentStreak, newLongestStreak, today);

  res.json({
    success: true,
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak
  });
});

// ============ HELPER FUNCTIONS ============

function getPlayerProfile(playerId) {
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) return null;

  const stats = db.prepare('SELECT * FROM player_stats WHERE player_id = ?').get(playerId);
  const achievements = db.prepare('SELECT achievement_id FROM player_achievements WHERE player_id = ?').all(playerId);

  return {
    id: player.id,
    displayName: player.display_name,
    stats: {
      totalGamesPlayed: stats.total_games_played,
      totalPuzzlesSolved: stats.total_puzzles_solved,
      totalWins: stats.total_wins,
      magicGraphSolved: stats.magic_graph_solved,
      sequenceRaceWins: stats.sequence_race_wins,
      shapeArchitectBuilt: stats.shape_architect_built,
      bestTimes: {
        magicGraphFastest: stats.magic_graph_fastest,
        sequenceRaceFastest: stats.sequence_race_fastest,
        shapeArchitectFastest: stats.shape_architect_fastest
      }
    },
    rank: calculateRank(stats.total_games_played, stats.total_puzzles_solved),
    streak: player.streak,
    lastPlayedDate: player.last_played_date,
    achievements: achievements.map(a => a.achievement_id),
    preferences: {
      soundEnabled: player.sound_enabled === 1,
      practiceMode: player.practice_mode === 1,
      language: player.language
    },
    createdAt: player.created_at,
    version: player.version
  };
}

// Rank thresholds - must match frontend
const RANK_THRESHOLDS = [
  { rank: 'grandmaster', games: 500, solves: 300 },
  { rank: 'master', games: 200, solves: 150 },
  { rank: 'expert', games: 100, solves: 75 },
  { rank: 'advanced', games: 60, solves: 40 },
  { rank: 'intermediate', games: 30, solves: 20 },
  { rank: 'apprentice', games: 15, solves: 10 },
  { rank: 'learner', games: 5, solves: 3 },
  { rank: 'beginner', games: 0, solves: 0 }
];

function calculateRank(gamesPlayed, puzzlesSolved) {
  for (const threshold of RANK_THRESHOLDS) {
    if (gamesPlayed >= threshold.games && puzzlesSolved >= threshold.solves) {
      return threshold.rank;
    }
  }
  return 'beginner';
}

// ============ START SERVER ============

app.listen(PORT, () => {
  console.log(`Math Games API server running on http://localhost:${PORT}`);
});
