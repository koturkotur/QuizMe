/**
 * "Igraj za rekord" storage.
 * Keys (separate from existing data):
 *   quizme_record_best:        number (best streak)
 *   quizme_record_attempts:     [{ date, streak, failedQuestionId, isRecord, isPerfect }]
 *   quizme_record_active:      { questionIds, index, streak, answeredIds } | null
 */

const BEST_KEY = 'quizme_record_best';
const ATTEMPTS_KEY = 'quizme_record_attempts';
const ACTIVE_KEY = 'quizme_record_active';

const MAX_QUESTIONS = 170;

function safeParse(key, fallback) {
  try {
    const data = localStorage.getItem(key);
    if (!data) return fallback;
    return JSON.parse(data);
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

export function getRecordBest() {
  const best = safeParse(BEST_KEY, null);
  return typeof best === 'number' ? best : null;
}

export function setRecordBest(value) {
  safeWrite(BEST_KEY, value);
}

export function getRecordAttempts() {
  const arr = safeParse(ATTEMPTS_KEY, []);
  return Array.isArray(arr) ? arr : [];
}

export function addRecordAttempt(attempt) {
  const arr = getRecordAttempts();
  arr.unshift(attempt);
  safeWrite(ATTEMPTS_KEY, arr);
  return arr;
}

export function getRecordActive() {
  return safeParse(ACTIVE_KEY, null);
}

export function setRecordActive(state) {
  if (state == null) {
    try {
      localStorage.removeItem(ACTIVE_KEY);
    } catch (e) {
      console.error('Error clearing active record', e);
    }
    return;
  }
  safeWrite(ACTIVE_KEY, state);
}

export function clearRecordActive() {
  setRecordActive(null);
}

export { MAX_QUESTIONS };
