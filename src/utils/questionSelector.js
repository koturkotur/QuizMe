/**
 * Smart question selection algorithm.
 *
 * Priorities (highest first):
 *  1) hardest questions (highest difficulty score)
 *  2) ever-wrong questions
 *  3) recently-wrong questions
 *  4) least recently seen
 *  5) everything else
 *
 * The returned order is stable per call; callers may slice however many they need.
 * A light jitter prevents the exact same ordering on consecutive calls.
 */

import { getAllQuestionStats, getDifficultyScore } from './questionStats';
import { shuffleArray } from './parser';

/**
 * Build an ordered list of question ids, prioritising weak spots.
 */
export function buildSmartOrder(allQuestions) {
  const stats = getAllQuestionStats();

  const enriched = allQuestions.map((q) => {
    const s = stats[q.id] || {
      shown: 0,
      correct: 0,
      wrong: 0,
      everWrong: false,
      lastSeenAt: null,
      lastWrongAt: null,
      lastCorrectAt: null
    };

    const difficulty = getDifficultyScore(q.id);

    let lastSeenTs = 0;
    if (s.lastSeenAt) lastSeenTs = new Date(s.lastSeenAt).getTime();

    let lastWrongTs = 0;
    if (s.lastWrongAt) lastWrongTs = new Date(s.lastWrongAt).getTime();

    return {
      id: q.id,
      question: q,
      difficulty,
      wrong: s.wrong,
      everWrong: s.everWrong,
      lastSeenTs,
      lastWrongTs,
      shown: s.shown
    };
  });

  // Bucket so we can shuffle inside each priority tier (avoids "same question always first").
  const tier1 = []; // hardest
  const tier2 = []; // ever wrong but lower difficulty
  const tier3 = []; // recently wrong
  const tier4 = []; // least seen
  const tier5 = []; // rest

  const nowTs = Date.now();

  for (const item of enriched) {
    if (item.difficulty >= 0.5) {
      tier1.push(item);
    } else if (item.everWrong) {
      tier2.push(item);
    } else if (item.lastWrongTs && nowTs - item.lastWrongTs < 1000 * 60 * 60 * 24 * 14) {
      tier3.push(item);
    } else if (item.shown === 0 || (item.lastSeenTs && nowTs - item.lastSeenTs > 1000 * 60 * 60 * 24 * 3)) {
      tier4.push(item);
    } else {
      tier5.push(item);
    }
  }

  const sortDescDifficulty = (a, b) => {
    if (b.difficulty !== a.difficulty) return b.difficulty - a.difficulty;
    return b.wrong - a.wrong;
  };
  const sortDescWrong = (a, b) => b.wrong - a.wrong || b.difficulty - a.difficulty;
  const sortAscSeen = (a, b) => a.lastSeenTs - b.lastSeenTs || a.shown - b.shown;

  tier1.sort(sortDescDifficulty);
  tier2.sort(sortDescWrong);
  tier3.sort((a, b) => b.lastWrongTs - a.lastWrongTs);
  tier4.sort(sortAscSeen);

  // Light shuffle within tier5 so the "rest" isn't always identical.
  const shuffledTier5 = shuffleArray(tier5);

  return [...tier1, ...tier2, ...tier3, ...tier4, ...shuffledTier5].map((item) => item.question);
}

/**
 * Pick N questions using the smart order, but never the given `excludeIds` set.
 * Used to avoid feeding the same question twice in a row.
 */
export function pickNextBatch(allQuestions, count, excludeIds = new Set()) {
  const ordered = buildSmartOrder(allQuestions);
  const picked = [];

  for (const q of ordered) {
    if (excludeIds.has(q.id)) continue;
    picked.push(q);
    if (picked.length >= count) break;
  }

  // Fallback: if filtering excluded too many, just fill from the rest.
  if (picked.length < count) {
    for (const q of allQuestions) {
      if (picked.includes(q)) continue;
      picked.push(q);
      if (picked.length >= count) break;
    }
  }

  return picked.slice(0, count);
}
