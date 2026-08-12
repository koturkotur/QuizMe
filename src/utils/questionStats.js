/**
 * Per-question statistics storage.
 *
 * Stored separately from test history (`quizme_history`) under `quizme_question_stats`,
 * so existing history/results are NEVER touched or migrated.
 *
 * Stats are keyed by question id and updated from every relevant mode:
 *   - Vežbaj sva pitenja
 *   - Vežbaj pogrešena pitanja
 *   - Savladaj sva pitanja
 *   - Test od 30 pitanja
 */

const STATS_KEY = 'quizme_question_stats';
const CHALLENGE_KEY = 'quizme_challenge';

/**
 * Get the entire stats map { [questionId]: QuestionStats }.
 * Returns {} for new users or legacy users without stats yet.
 */
export function getAllQuestionStats() {
  try {
    const data = localStorage.getItem(STATS_KEY);
    if (!data) return {};
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (e) {
    console.error('Error reading question stats:', e);
    return {};
  }
}

function persistStats(stats) {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Error persisting question stats:', e);
  }
}

/**
 * Ensure a stats entry exists for a question id, with safe defaults.
 * Legacy users without stats get a fresh record automatically.
 */
function ensureEntry(stats, questionId) {
  const id = Number(questionId);
  if (!stats[id]) {
    stats[id] = {
      shown: 0,
      correct: 0,
      wrong: 0,
      skipped: 0,
      streak: 0,
      longestStreak: 0,
      everWrong: false,
      lastSeenAt: null,
      lastWrongAt: null,
      lastCorrectAt: null
    };
  }
  return stats[id];
}

/**
 * Record a single answer for a question.
 * `outcome` is one of: 'correct' | 'wrong' | 'skipped'
 */
export function recordAnswer(questionId, outcome) {
  const stats = getAllQuestionStats();
  const entry = ensureEntry(stats, questionId);

  entry.shown += 1;
  const now = new Date().toISOString();
  entry.lastSeenAt = now;

  if (outcome === 'correct') {
    entry.correct += 1;
    entry.streak += 1;
    if (entry.streak > entry.longestStreak) {
      entry.longestStreak = entry.streak;
    }
    entry.lastCorrectAt = now;
  } else if (outcome === 'wrong') {
    entry.wrong += 1;
    entry.everWrong = true;
    entry.streak = 0;
    entry.lastWrongAt = now;
  } else if (outcome === 'skipped') {
    entry.skipped += 1;
    entry.streak = 0;
  }

  persistStats(stats);

  // Activate wrong-question recovery when user answers wrong anywhere.
  if (outcome === 'wrong') {
    activateWrongQuestion(questionId);
  }

  return entry;
}

/**
 * Record outcomes for a batch of questions at once (used after a test/practice round).
 * `items` = [{ id, outcome }]
 */
export function recordAnswers(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const stats = getAllQuestionStats();
  const now = new Date().toISOString();

  for (const item of items) {
    if (!item || item.id == null) continue;
    const entry = ensureEntry(stats, item.id);
    entry.shown += 1;
    entry.lastSeenAt = now;

    if (item.outcome === 'correct') {
      entry.correct += 1;
      entry.streak += 1;
      if (entry.streak > entry.longestStreak) entry.longestStreak = entry.streak;
      entry.lastCorrectAt = now;
    } else if (item.outcome === 'wrong') {
      entry.wrong += 1;
      entry.everWrong = true;
      entry.streak = 0;
      entry.lastWrongAt = now;
    } else if (item.outcome === 'skipped') {
      entry.skipped += 1;
      entry.streak = 0;
    }
  }

  persistStats(stats);

  // Activate wrong-question recovery for every wrong answer in the batch.
  for (const item of items) {
    if (item && item.outcome === 'wrong' && item.id != null) {
      activateWrongQuestion(item.id);
    }
  }
}

/**
 * Get stats for one question.
 */
export function getQuestionStats(questionId) {
  const stats = getAllQuestionStats();
  return stats[Number(questionId)] || null;
}

/**
 * Compute a difficulty score (0..1, higher = harder for this user).
 * Combines: error rate, ever-wrong penalty, recent-wrong boost, low attempts.
 */
export function getDifficultyScore(questionId) {
  const s = getQuestionStats(questionId);
  if (!s || s.shown === 0) return 0.2;

  const attempts = s.shown;
  const errorRate = s.wrong / attempts;
  const recentWrongBoost = s.lastWrongAt && (!s.lastCorrectAt || s.lastWrongAt > s.lastCorrectAt) ? 0.15 : 0;
  const everWrongBoost = s.everWrong ? 0.1 : 0;
  const lowAttemptsBoost = attempts < 3 ? 0.1 : 0;

  return Math.min(1, errorRate + recentWrongBoost + everWrongBoost + lowAttemptsBoost);
}

/**
 * Get ids of all questions the user has ever answered wrong at least once.
 */
export function getWrongQuestionIds() {
  const stats = getAllQuestionStats();
  return Object.keys(stats)
    .map(Number)
    .filter((id) => stats[id] && stats[id].everWrong);
}

/**
 * Get the hardest N question ids for this user.
 */
export function getHardestQuestionIds(count = 5) {
  const stats = getAllQuestionStats();
  const entries = Object.entries(stats).map(([id, s]) => ({
    id: Number(id),
    wrong: s.wrong,
    shown: s.shown,
    difficulty: getDifficultyScore(Number(id))
  }));

  entries.sort((a, b) => {
    if (b.wrong !== a.wrong) return b.wrong - a.wrong;
    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
    return a.id - b.id;
  });

  return entries.slice(0, count);
}

/**
 * Aggregate practice/challenge statistics for display.
 */
export function getPracticeStats() {
  const stats = getAllQuestionStats();
  const values = Object.values(stats);

  if (values.length === 0) {
    return {
      totalAnswered: 0,
      totalCorrect: 0,
      totalWrong: 0,
      wrongQuestions: 0,
      longestStreak: 0
    };
  }

  return {
    totalAnswered: values.reduce((sum, s) => sum + s.shown, 0),
    totalCorrect: values.reduce((sum, s) => sum + s.correct, 0),
    totalWrong: values.reduce((sum, s) => sum + s.wrong, 0),
    wrongQuestions: values.filter((s) => s.everWrong).length,
    longestStreak: Math.max(...values.map((s) => s.longestStreak || 0))
  };
}

/* -------------------------------------------------------------------------- */
/* Challenge ("Savladaj sva pitanja") persistence                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_CHALLENGE = {
  level: 1,
  mastered: {},
  completedRounds: 0,
  currentRoundStartedAt: null,
  bestStreak: 0
};

/**
 * Get challenge progress.
 * mastered: { [questionId]: true } for questions mastered on the CURRENT level.
 */
export function getChallenge() {
  try {
    const data = localStorage.getItem(CHALLENGE_KEY);
    if (!data) return { ...DEFAULT_CHALLENGE, mastered: {} };
    const parsed = JSON.parse(data);
    return {
      level: parsed.level || 1,
      mastered: parsed.mastered && typeof parsed.mastered === 'object' ? parsed.mastered : {},
      completedRounds: parsed.completedRounds || 0,
      currentRoundStartedAt: parsed.currentRoundStartedAt || null,
      bestStreak: parsed.bestStreak || 0
    };
  } catch (e) {
    console.error('Error reading challenge:', e);
    return { ...DEFAULT_CHALLENGE, mastered: {} };
  }
}

export function saveChallenge(challenge) {
  try {
    localStorage.setItem(CHALLENGE_KEY, JSON.stringify(challenge));
  } catch (e) {
    console.error('Error saving challenge:', e);
  }
}

/**
 * Mark a question as mastered on the current level.
 */
export function markMastered(questionId) {
  const challenge = getChallenge();
  challenge.mastered[Number(questionId)] = true;
  saveChallenge(challenge);
  return challenge;
}

/**
 * Returns true if a question is already mastered on the current level.
 */
export function isMastered(questionId) {
  const challenge = getChallenge();
  return Boolean(challenge.mastered[Number(questionId)]);
}

/**
 * Count mastered questions on the current level.
 */
export function countMastered() {
  const challenge = getChallenge();
  return Object.keys(challenge.mastered).length;
}

/**
 * Reset mastered map when a level is completed (called before level++).
 */
export function resetMastered() {
  const challenge = getChallenge();
  challenge.mastered = {};
  saveChallenge(challenge);
  return challenge;
}

/**
 * Advance to the next level. Handles wrap-around to round 2.
 * Returns the updated challenge.
 */
export function advanceLevel() {
  const challenge = getChallenge();
  challenge.level += 1;
  challenge.mastered = {};
  if (challenge.level > 10) {
    challenge.completedRounds += 1;
    challenge.level = 1;
    challenge.currentRoundStartedAt = new Date().toISOString();
  }
  saveChallenge(challenge);
  return challenge;
}

/**
 * Update best streak if needed.
 */
export function updateBestStreak(streak) {
  if (streak == null) return;
  const challenge = getChallenge();
  if (streak > challenge.bestStreak) {
    challenge.bestStreak = streak;
    saveChallenge(challenge);
  }
}

/* -------------------------------------------------------------------------- */
/* Wrong-question recovery ("Vežbaj pogrešena pitanja") persistence             */
/* -------------------------------------------------------------------------- */
/*
 * Model:
 *   quizme_recovery:  { [questionId]: { progress, activatedAt, masteredAt } }
 *   quizme_wrong_cycle:      active cycle object (or null)
 *   quizme_wrong_cycles:     array of completed cycles (history)
 *   quizme_wrong_aggregate:  { totalMastered, totalErrors, completedCycles }
 *
 * Active wrong questions = entries in quizme_recovery where masteredAt == null.
 * When user answers wrong anywhere → activateWrongQuestion(id) sets progress=0.
 * When user answers correctly in wrong-questions mode → bumpRecovery(id).
 *   - progress 0→1→2→3; at 3 → masteredAt set, removed from active pool.
 * When user answers wrong in wrong-questions mode → resetRecovery(id) → progress=0.
 */

const RECOVERY_KEY = 'quizme_recovery';
const WRONG_CYCLE_KEY = 'quizme_wrong_cycle';
const WRONG_CYCLES_KEY = 'quizme_wrong_cycles';
const WRONG_AGG_KEY = 'quizme_wrong_aggregate';

const RECOVERY_TARGET = 3;

function safeParse(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    const parsed = JSON.parse(data);
    return parsed == null ? fallback : parsed;
  } catch (e) {
    console.error('Error reading', key, e);
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Error writing', key, e);
  }
}

/* ------------------------------ Recovery map ------------------------------- */

export function getRecoveryMap() {
  const map = safeParse(RECOVERY_KEY, {});
  return map && typeof map === 'object' ? map : {};
}

function persistRecovery(map) {
  safeWrite(RECOVERY_KEY, map);
}

/**
 * Get ids of all currently ACTIVE wrong questions (not yet mastered: 0..2/3).
 */
export function getActiveWrongQuestionIds() {
  const map = getRecoveryMap();
  return Object.keys(map)
    .map(Number)
    .filter((id) => map[id] && !map[id].masteredAt);
}

/**
 * Get recovery progress for a question (0..3). Returns 0 if not active.
 */
export function getRecoveryProgress(questionId) {
  const map = getRecoveryMap();
  const entry = map[Number(questionId)];
  return entry ? entry.progress : 0;
}

/**
 * Activate a question as a wrong question (called when user answers wrong anywhere).
 * - Sets progress to 0
 * - Sets activatedAt
 * - Increments totalErrors aggregate
 * - If no active cycle, starts a new one
 *
 * This is idempotent: re-activating an already-active question keeps it active
 * but resets progress to 0 (user made another mistake on it).
 * Re-activating a previously-mastered question brings it back into the active pool.
 */
export function activateWrongQuestion(questionId) {
  const id = Number(questionId);
  const map = getRecoveryMap();
  const now = new Date().toISOString();

  const wasMastered = map[id] && map[id].masteredAt;

  map[id] = {
    progress: 0,
    activatedAt: now,
    masteredAt: null
  };
  persistRecovery(map);

  // Aggregate: count every (re)activation as an error entry.
  const agg = getWrongAggregate();
  agg.totalErrors = (agg.totalErrors || 0) + 1;
  persistWrongAggregate(agg);

  // Start a cycle if none active.
  let cycle = getActiveWrongCycle();
  if (!cycle) {
    cycle = startWrongCycle();
  }
  safeWrite(WRONG_CYCLE_KEY, cycle);

  return { map, cycle, wasMastered };
}

/**
 * Bump recovery progress for a question answered correctly in wrong-questions mode.
 * Returns { progress, mastered } where mastered=true if it just reached 3/3.
 */
export function bumpRecovery(questionId) {
  const id = Number(questionId);
  const map = getRecoveryMap();
  const entry = map[id] || { progress: 0, activatedAt: new Date().toISOString(), masteredAt: null };

  entry.progress = Math.min(RECOVERY_TARGET, entry.progress + 1);
  let mastered = false;

  if (entry.progress >= RECOVERY_TARGET) {
    entry.masteredAt = new Date().toISOString();
    mastered = true;

    const agg = getWrongAggregate();
    agg.totalMastered = (agg.totalMastered || 0) + 1;
    persistWrongAggregate(agg);
  }

  map[id] = entry;
  persistRecovery(map);

  return { progress: entry.progress, mastered };
}

/**
 * Reset recovery progress to 0 (called when user answers wrong in wrong-questions mode).
 */
export function resetRecovery(questionId) {
  const id = Number(questionId);
  const map = getRecoveryMap();
  if (map[id]) {
    map[id].progress = 0;
    map[id].masteredAt = null;
    map[id].activatedAt = new Date().toISOString();
    persistRecovery(map);
  }
  return map[id];
}

/* --------------------------------- Cycle ----------------------------------- */

export function getActiveWrongCycle() {
  const cycle = safeParse(WRONG_CYCLE_KEY, null);
  if (!cycle || typeof cycle !== 'object') return null;
  if (!cycle.active) return null;
  return cycle;
}

export function startWrongCycle() {
  const activeIds = getActiveWrongQuestionIds();
  const cycle = {
    id: Date.now(),
    active: true,
    startedAt: new Date().toISOString(),
    completedAt: null,
    initialCount: activeIds.length,
    rounds: 0,
    totalAnswers: 0,
    correct: 0,
    wrong: 0,
    masteredInCycle: [],
    hardestQuestionId: null,
    hardestWrongCount: 0
  };
  safeWrite(WRONG_CYCLE_KEY, cycle);
  return cycle;
}

export function updateWrongCycle(updates) {
  const cycle = getActiveWrongCycle();
  if (!cycle) return null;
  const next = { ...cycle, ...updates };
  safeWrite(WRONG_CYCLE_KEY, next);
  return next;
}

export function recordWrongCycleAnswer(isCorrect, questionId) {
  const cycle = getActiveWrongCycle();
  if (!cycle) return null;

  const updates = {
    totalAnswers: cycle.totalAnswers + 1,
    correct: cycle.correct + (isCorrect ? 1 : 0),
    wrong: cycle.wrong + (isCorrect ? 0 : 1)
  };

  // Track hardest question in this cycle (most wrongs).
  if (!isCorrect) {
    const stats = getAllQuestionStats();
    const qStats = stats[Number(questionId)];
    const wrongCount = qStats ? qStats.wrong : 0;
    if (wrongCount >= updates.hardestWrongCount) {
      updates.hardestQuestionId = Number(questionId);
      updates.hardestWrongCount = wrongCount;
    }
  }

  return updateWrongCycle(updates);
}

export function incrementWrongCycleRound() {
  const cycle = getActiveWrongCycle();
  if (!cycle) return null;
  return updateWrongCycle({ rounds: cycle.rounds + 1 });
}

export function addMasteredToCycle(questionId) {
  const cycle = getActiveWrongCycle();
  if (!cycle) return null;
  const masteredInCycle = [...(cycle.masteredInCycle || []), Number(questionId)];
  return updateWrongCycle({ masteredInCycle });
}

/**
 * Complete the active cycle (called when all active wrong questions are mastered).
 * Moves it to history and increments completedCycles.
 */
export function completeWrongCycle() {
  const cycle = getActiveWrongCycle();
  if (!cycle) return null;

  const completed = {
    ...cycle,
    active: false,
    completedAt: new Date().toISOString(),
    percentage: cycle.totalAnswers > 0 ? Math.round((cycle.correct / cycle.totalAnswers) * 100) : 0
  };

  const history = safeParse(WRONG_CYCLES_KEY, []);
  history.push(completed);
  safeWrite(WRONG_CYCLES_KEY, history);

  const agg = getWrongAggregate();
  agg.completedCycles = (agg.completedCycles || 0) + 1;
  persistWrongAggregate(agg);

  // Clear the active cycle.
  safeWrite(WRONG_CYCLE_KEY, null);

  return completed;
}

export function getCompletedWrongCycles() {
  const arr = safeParse(WRONG_CYCLES_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

/* ------------------------------- Aggregate --------------------------------- */

export function getWrongAggregate() {
  const agg = safeParse(WRONG_AGG_KEY, {
    totalMastered: 0,
    totalErrors: 0,
    completedCycles: 0
  });
  return agg;
}

function persistWrongAggregate(agg) {
  safeWrite(WRONG_AGG_KEY, agg);
}

/**
 * Get a summary for display on the home card and intro screen.
 */
export function getWrongSummary() {
  const activeIds = getActiveWrongQuestionIds();
  const agg = getWrongAggregate();
  const cycle = getActiveWrongCycle();
  const completedCycles = getCompletedWrongCycles();

  return {
    activeCount: activeIds.length,
    totalMastered: agg.totalMastered || 0,
    totalErrors: agg.totalErrors || 0,
    completedCycles: agg.completedCycles || 0,
    hasActiveCycle: Boolean(cycle),
    cycleInitialCount: cycle ? cycle.initialCount : 0,
    cycleMasteredCount: cycle ? (cycle.masteredInCycle || []).length : 0,
    lastCycle: completedCycles.length > 0 ? completedCycles[completedCycles.length - 1] : null
  };
}

export const RECOVERY_TARGET_COUNT = RECOVERY_TARGET;

