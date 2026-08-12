/**
 * Per-question statistics storage.
 *
 * Stored separately from test history (`quizme_history`) under `quizme_question_stats`,
 * so existing history/results are NEVER touched or migrated.
 *
 * Stats are keyed by question id and updated from every relevant mode:
 *   - Vežbaj sva pitenja
 *   - Vežbaj pogrešna pitanja
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
