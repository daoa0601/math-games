/**
 * API Client Service
 * Handles communication with the backend server for player data
 */

import type { PlayerProfile, PlayerStats, PlayerPreferences } from './player';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Local storage keys
const PLAYER_ID_KEY = 'math-games-player-id';
const GUEST_MODE_KEY = 'math-games-guest-mode';

// Track API availability status
let apiAvailable: boolean | null = null;

/**
 * Check if the API server is available
 * Returns true if server responds, false if unreachable
 */
export async function checkApiAvailability(): Promise<boolean> {
  // Return cached result if we've already checked
  if (apiAvailable !== null) {
    return apiAvailable;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`${API_BASE_URL}/api/players/health`, {
      method: 'GET',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    apiAvailable = response.ok;
    return apiAvailable;
  } catch {
    // Network error, server unreachable, or timeout
    apiAvailable = false;
    return false;
  }
}

/**
 * Check if the API is known to be available
 * Returns null if not yet checked
 */
export function isApiAvailable(): boolean | null {
  return apiAvailable;
}

/**
 * Reset API availability check (for retrying)
 */
export function resetApiAvailability(): void {
  apiAvailable = null;
}

/**
 * Get the current player ID from localStorage
 */
export function getCurrentPlayerId(): string | null {
  return localStorage.getItem(PLAYER_ID_KEY);
}

/**
 * Set the current player ID in localStorage
 */
export function setCurrentPlayerId(playerId: string): void {
  localStorage.setItem(PLAYER_ID_KEY, playerId);
}

/**
 * Clear the current player ID (logout)
 */
export function clearCurrentPlayerId(): void {
  localStorage.removeItem(PLAYER_ID_KEY);
}

/**
 * Check if a player is logged in
 */
export function isLoggedIn(): boolean {
  return getCurrentPlayerId() !== null;
}

/**
 * Check if playing as guest (local storage only, no server sync)
 */
export function isGuestMode(): boolean {
  return localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

// ============ API HELPER ============

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { data: null, error: data.error || 'Request failed' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('API request failed:', error);
    return { data: null, error: 'Network error - server may be offline' };
  }
}

// ============ PLAYER API ============

export interface LoginResult {
  profile: PlayerProfile;
  isNewPlayer: boolean;
}

/**
 * Login or register a player by their ID
 */
export async function loginPlayer(playerId: string): Promise<ApiResponse<LoginResult>> {
  const result = await apiRequest<LoginResult>('/api/players/login', {
    method: 'POST',
    body: JSON.stringify({ playerId }),
  });

  if (result.data) {
    setCurrentPlayerId(playerId.trim().toLowerCase());
  }

  return result;
}

/**
 * Get the current player's profile from the server
 */
export async function fetchPlayerProfile(): Promise<ApiResponse<PlayerProfile>> {
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest<PlayerProfile>(`/api/players/${playerId}`);
}

/**
 * Update player display name
 */
export async function updateDisplayNameApi(displayName: string): Promise<ApiResponse<{ success: boolean; displayName: string }>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: { success: true, displayName }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/name`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
}

/**
 * Update player preferences
 */
export async function updatePreferencesApi(
  preferences: Partial<PlayerPreferences>
): Promise<ApiResponse<{ success: boolean }>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: { success: true }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/preferences`, {
    method: 'PATCH',
    body: JSON.stringify(preferences),
  });
}

// ============ STATS API ============

export interface StatsUpdateResult {
  success: boolean;
  stats: PlayerStats;
  rank: string;
  rankedUp: boolean;
  previousRank: string;
}

/**
 * Update player stats (incremental)
 */
export async function updateStatsApi(updates: {
  totalGamesPlayed?: number;
  totalPuzzlesSolved?: number;
  totalWins?: number;
  magicGraphSolved?: number;
  sequenceRaceWins?: number;
  shapeArchitectBuilt?: number;
  bestTime?: Partial<PlayerStats['bestTimes']>;
}): Promise<ApiResponse<StatsUpdateResult>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: null, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/stats`, {
    method: 'POST',
    body: JSON.stringify(updates),
  });
}

// ============ ACHIEVEMENTS API ============

/**
 * Unlock an achievement
 */
export async function unlockAchievementApi(
  achievementId: string
): Promise<ApiResponse<{ success: boolean; alreadyUnlocked: boolean }>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: { success: true, alreadyUnlocked: false }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/achievements`, {
    method: 'POST',
    body: JSON.stringify({ achievementId }),
  });
}

// ============ STREAK API ============

export interface PlaySessionResult {
  success: boolean;
  streak: number;
  streakBroken: boolean;
  streakContinued: boolean;
  lastPlayedDate: string;
}

/**
 * Record a play session and update streak
 */
export async function recordPlaySessionApi(): Promise<ApiResponse<PlaySessionResult>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: null, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/play-session`, {
    method: 'POST',
  });
}

// ============ GAME PROGRESS API ============

export interface LevelProgress {
  level_id: string;
  completed: number;
  best_time: number | null;
  completed_at: string | null;
}

/**
 * Get game progress for a specific game
 */
export async function fetchGameProgress(
  gameId: string
): Promise<ApiResponse<LevelProgress[]>> {
  // Skip server fetch for guest mode - use local storage
  if (isGuestMode()) {
    return { data: [], error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/progress/${gameId}`);
}

/**
 * Save level completion
 */
export async function saveLevelCompletion(
  gameId: string,
  levelId: string,
  timeSeconds: number
): Promise<ApiResponse<{ success: boolean; isPersonalBest: boolean; bestTime: number }>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: { success: true, isPersonalBest: false, bestTime: timeSeconds }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/progress/${gameId}`, {
    method: 'POST',
    body: JSON.stringify({ levelId, timeSeconds }),
  });
}

// ============ DAILY CHALLENGE API ============

export interface DailyChallengeStatus {
  challenges: Array<{
    game_id: string;
    completed: number;
    time_seconds: number | null;
    completed_at: string | null;
  }>;
  streaks: Array<{
    game_id: string;
    current_streak: number;
    longest_streak: number;
    last_completed_date: string | null;
  }>;
}

/**
 * Get daily challenge status for a specific date
 */
export async function fetchDailyChallengeStatus(
  date: string
): Promise<ApiResponse<DailyChallengeStatus>> {
  // Skip server fetch for guest mode - use local storage
  if (isGuestMode()) {
    return { data: { challenges: [], streaks: [] }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/daily/${date}`);
}

/**
 * Complete a daily challenge
 */
export async function completeDailyChallengeApi(
  gameId: string,
  timeSeconds: number
): Promise<ApiResponse<{ success: boolean; currentStreak: number; longestStreak: number }>> {
  // Skip server sync for guest mode
  if (isGuestMode()) {
    return { data: { success: true, currentStreak: 0, longestStreak: 0 }, error: null };
  }
  const playerId = getCurrentPlayerId();
  if (!playerId) {
    return { data: null, error: 'Not logged in' };
  }

  return apiRequest(`/api/players/${playerId}/daily/${gameId}`, {
    method: 'POST',
    body: JSON.stringify({ timeSeconds }),
  });
}

/**
 * Logout - clear player ID and optionally clear cached profile
 */
export function logout(): void {
  clearCurrentPlayerId();
  // Clear the cached profile from localStorage
  localStorage.removeItem('math-games-player');
}
