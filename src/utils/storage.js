/**
 * localStorage helpers for test history
 */

const HISTORY_KEY = 'quizme_history';
const MAX_HISTORY_ITEMS = 50;

function buildTestFingerprint(testResult) {
  const questionSignature = (testResult.questions || [])
    .map((q) => `${q.id}:${q.userAnswer || '-'}:${q.correctAnswer || '-'}`)
    .join('|');

  return `${testResult.score}-${testResult.maxScore}-${testResult.correctCount}-${testResult.totalQuestions}-${questionSignature}`;
}

function normalizeHistoryEntries(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  const normalized = [];
  const seenFingerprints = new Set();

  for (const entry of history) {
    if (!entry || !Array.isArray(entry.questions)) {
      continue;
    }

    const fingerprint = entry.fingerprint || buildTestFingerprint(entry);
    if (seenFingerprints.has(fingerprint)) {
      continue;
    }

    seenFingerprints.add(fingerprint);
    normalized.push({ ...entry, fingerprint });
  }

  return normalized.slice(0, MAX_HISTORY_ITEMS);
}

/**
 * Get all test history from localStorage
 */
export function getTestHistory() {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    const parsed = data ? JSON.parse(data) : [];
    const normalized = normalizeHistoryEntries(parsed);

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(normalized));
    }

    return normalized;
  } catch (e) {
    console.error('Error reading history:', e);
    return [];
  }
}

/**
 * Save a test result to history
 */
export function saveTestResult(testResult) {
  try {
    const history = getTestHistory();
    const fingerprint = buildTestFingerprint(testResult);

    const alreadySaved = history.find((entry) => entry.fingerprint === fingerprint);
    if (alreadySaved) {
      return alreadySaved;
    }
    
    const newEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      score: testResult.score,
      maxScore: testResult.maxScore,
      correctCount: testResult.correctCount,
      totalQuestions: testResult.totalQuestions,
      percentage: Math.round((testResult.score / testResult.maxScore) * 100),
      questions: testResult.questions.map(q => ({
        id: q.id,
        text: q.text,
        userAnswer: q.userAnswer,
        correctAnswer: q.correctAnswer,
        isCorrect: q.userAnswer === q.correctAnswer
      })),
      fingerprint
    };
    
    history.unshift(newEntry);
    
    // Keep only the most recent entries
    const trimmed = history.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    
    return newEntry;
  } catch (e) {
    console.error('Error saving test result:', e);
    return null;
  }
}

/**
 * Get a specific test from history by ID
 */
export function getTestById(id) {
  const history = getTestHistory();
  return history.find(t => t.id === parseInt(id)) || null;
}

/**
 * Clear all test history
 */
export function clearTestHistory() {
  try {
    localStorage.removeItem(HISTORY_KEY);
    return true;
  } catch (e) {
    console.error('Error clearing history:', e);
    return false;
  }
}

/**
 * Get statistics from history
 */
export function getHistoryStats() {
  const history = getTestHistory();
  
  if (history.length === 0) {
    return {
      totalTests: 0,
      averageScore: 0,
      averagePercentage: 0,
      bestScore: 0,
      bestPercentage: 0
    };
  }
  
  const totalTests = history.length;
  const averagePercentage = Math.round(
    history.reduce((sum, t) => sum + t.percentage, 0) / totalTests
  );
  const bestPercentage = Math.max(...history.map(t => t.percentage));
  
  return {
    totalTests,
    averageScore: Math.round(history.reduce((sum, t) => sum + t.score, 0) / totalTests),
    averagePercentage,
    bestScore: Math.max(...history.map(t => t.score)),
    bestPercentage
  };
}

/**
 * Format date for display in Serbian
 */
export function formatDate(isoString) {
  const date = new Date(isoString);
  const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return date.toLocaleDateString('sr-RS', options);
}

/**
 * Format date with time
 */
export function formatDateTime(isoString) {
  const date = new Date(isoString);
  const dateOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const timeOptions = { hour: '2-digit', minute: '2-digit' };
  
  const dateStr = date.toLocaleDateString('sr-RS', dateOptions);
  const timeStr = date.toLocaleTimeString('sr-RS', timeOptions);
  
  return `${dateStr} u ${timeStr}`;
}
