import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { questionsData } from '../data/questions';
import { shuffleArray, preparePracticeQuestions } from '../utils/parser';
import { buildSmartOrder } from '../utils/questionSelector';
import {
  getChallenge,
  markMastered,
  isMastered,
  countMastered,
  advanceLevel,
  resetMastered,
  updateBestStreak,
  recordAnswer,
  getHardestQuestionIds,
  getPracticeStats
} from '../utils/questionStats';

const ROUND_SIZE = 10;
const TOTAL_LEVELS = 10;
const TOTAL_QUESTIONS = questionsData.length;

function LevelDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const level = i + 1;
        const isCurrent = level === current;
        const isDone = level < current;
        return (
          <span
            key={level}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isCurrent ? 'bg-primary w-6' : isDone ? 'bg-primary/70' : 'bg-outline-variant/40'
            }`}
          />
        );
      })}
    </div>
  );
}

function shuffleAnswers(question) {
  return preparePracticeQuestions([question])[0];
}

export default function ChallengeScreen() {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(() => getChallenge());
  const [sessionQueue, setSessionQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [roundResults, setRoundResults] = useState([]);
  const [recentlySeen, setRecentlySeen] = useState(new Set());
  const [view, setView] = useState('intro'); // intro | playing | roundSummary | levelComplete | challengeComplete
  const [levelStats, setLevelStats] = useState({ correct: 0, wrong: 0, answered: 0 });

  const masteredCount = countMastered();

  // Build a fresh session queue of non-mastered questions using smart order.
  const buildQueue = useCallback(() => {
    const masteredSet = new Set(
      Object.keys(getChallenge().mastered).map(Number)
    );

    let candidates = buildSmartOrder(questionsData).filter(
      (q) => !masteredSet.has(q.id)
    );

    // If somehow everything is mastered (shouldn't happen mid-level), fallback.
    if (candidates.length === 0) {
      candidates = [...questionsData];
    }

    return shuffleArray(candidates);
  }, []);

  const startRound = useCallback(() => {
    const queue = buildQueue();
    setSessionQueue(queue);
    setQueueIndex(0);
    setRoundResults([]);
    setRecentlySeen(new Set());
    if (queue.length > 0) {
      const first = shuffleAnswers(queue[0]);
      setCurrentQuestion(first);
      setRecentlySeen(new Set([queue[0].id]));
    }
    setSelected(null);
    setRevealed(false);
    setStreak(0);
    setView('playing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [buildQueue]);

  const handleSelect = (letter) => {
    if (revealed || !currentQuestion) return;
    setSelected(letter);
    setRevealed(true);

    const isCorrect = letter === currentQuestion.correctAnswer;
    const outcome = isCorrect ? 'correct' : 'wrong';

    recordAnswer(currentQuestion.id, outcome);

    const newStreak = isCorrect ? streak + 1 : 0;
    setStreak(newStreak);
    updateBestStreak(newStreak);

    const result = { question: currentQuestion, outcome, isCorrect };
    setRoundResults((prev) => [...prev, result]);

    if (isCorrect) {
      markMastered(currentQuestion.id);
      setChallenge(getChallenge());
    }

    setLevelStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
      answered: prev.answered + 1
    }));
  };

  const handleNext = useCallback(() => {
    const answeredInRound = roundResults.length;

    if (answeredInRound >= ROUND_SIZE) {
      // Round is over.
      const masteredNow = countMastered();
      if (masteredNow >= TOTAL_QUESTIONS) {
        // Level complete!
        setView('levelComplete');
      } else {
        setView('roundSummary');
      }
      return;
    }

    // Pick next question: avoid recently seen, prefer smart order from queue.
    // Requeue wrong questions later: they stay in queue (not mastered).
    const masteredSet = new Set(Object.keys(getChallenge().mastered).map(Number));
    let nextQ = null;
    let nextIdx = queueIndex + 1;

    // Look ahead in the queue for a non-mastered, non-recently-seen question.
    for (let i = queueIndex + 1; i < sessionQueue.length && !nextQ; i++) {
      const candidate = sessionQueue[i];
      if (masteredSet.has(candidate.id)) continue;
      if (recentlySeen.has(candidate.id)) continue;
      nextQ = candidate;
      nextIdx = i;
    }

    // If nothing ahead, loop from start (skip mastered + recently seen).
    if (!nextQ) {
      for (let i = 0; i < queueIndex && !nextQ; i++) {
        const candidate = sessionQueue[i];
        if (masteredSet.has(candidate.id)) continue;
        if (recentlySeen.has(candidate.id)) continue;
        nextQ = candidate;
        nextIdx = i;
      }
    }

    // Fallback: any non-mastered.
    if (!nextQ) {
      for (const q of sessionQueue) {
        if (!masteredSet.has(q.id)) {
          nextQ = q;
          nextIdx = sessionQueue.indexOf(q);
          break;
        }
      }
    }

    if (!nextQ) {
      // Everything mastered → level complete.
      setView('levelComplete');
      return;
    }

    setQueueIndex(nextIdx);
    const prepared = shuffleAnswers(nextQ);
    setCurrentQuestion(prepared);
    setRecentlySeen((prev) => {
      const next = new Set(prev);
      next.add(nextQ.id);
      // Keep only last 5 seen to allow requeue after a few others.
      if (next.size > 5) {
        const first = next.values().next().value;
        next.delete(first);
      }
      return next;
    });
    setSelected(null);
    setRevealed(false);
  }, [roundResults.length, queueIndex, sessionQueue, recentlySeen]);

  const handleAdvanceLevel = () => {
    const updated = advanceLevel();
    setChallenge(updated);
    setLevelStats({ correct: 0, wrong: 0, answered: 0 });

    if (updated.level === 1 && updated.completedRounds > 0) {
      // Just wrapped a full 10-level round.
      setView('challengeComplete');
    } else {
      setView('intro');
    }
  };

  const handleContinueAfterRound = () => {
    startRound();
  };

  const handleStopForNow = () => {
    navigate('/');
  };

  /* ----------------------------------- INTRO ---------------------------------- */
  if (view === 'intro') {
    return (
      <div className="app-page">
        <TopBar title="Savladaj sva pitanja" showBack />

        <section className="mb-6 mt-5 app-card p-6">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Savladaj sva pitanja</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Prođi svih 10 nivoa i odgovori tačno na svako pitanje najmanje 10 puta.
          </p>

          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline font-bold text-on-surface">Nivo {challenge.level} od {TOTAL_LEVELS}</span>
              <span className="text-sm font-semibold text-on-surface-variant">
                {masteredCount} / {TOTAL_QUESTIONS} pitanja
              </span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-1">
              <div
                className="h-full progress-bar-fill rounded-full transition-all duration-300"
                style={{ width: `${(masteredCount / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
            <div className="mt-4">
              <LevelDots current={challenge.level} total={TOTAL_LEVELS} />
            </div>
          </div>

          {challenge.completedRounds > 0 && (
            <p className="text-sm font-semibold text-tertiary mt-4">
              Završeni krugovi: {challenge.completedRounds}
            </p>
          )}
        </section>

        <section className="pb-8">
          <Button onClick={startRound} size="lg" className="w-full">
            {masteredCount > 0 ? 'Nastavi izazov' : 'Započni izazov'}
          </Button>
        </section>
      </div>
    );
  }

  /* ------------------------------- ROUND SUMMARY ------------------------------- */
  if (view === 'roundSummary') {
    const roundCorrect = roundResults.filter((r) => r.isCorrect).length;
    const roundWrong = roundResults.length - roundCorrect;
    const newlyMastered = roundResults.filter((r) => r.isCorrect).length;
    const masteredNow = countMastered();

    return (
      <div className="app-page">
        <TopBar title="Savladaj sva pitanja" showBack />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-5xl">flag</span>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface mt-3">Runda završena</h2>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="app-card-soft p-4 border-success/20">
              <p className="text-2xl font-bold text-success">{roundCorrect}</p>
              <p className="text-xs text-on-surface-variant mt-1">Tačnih</p>
            </div>
            <div className="app-card-soft p-4 border-error/20">
              <p className="text-2xl font-bold text-error">{roundWrong}</p>
              <p className="text-xs text-on-surface-variant mt-1">Pogrešnih</p>
            </div>
          </div>

          <div className="mt-6">
            <p className="font-headline font-bold text-lg text-on-surface">
              Nivo {challenge.level} — {masteredNow} / {TOTAL_QUESTIONS}
            </p>
            <div className="h-2.5 bg-surface-container rounded-full overflow-hidden mt-3">
              <div
                className="h-full progress-bar-fill transition-all"
                style={{ width: `${(masteredNow / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={handleContinueAfterRound} className="w-full">Još 10</Button>
            <Button onClick={handleStopForNow} variant="ghost" className="w-full">Završi za sada</Button>
          </div>
        </section>
      </div>
    );
  }

  /* ------------------------------ LEVEL COMPLETE ------------------------------ */
  if (view === 'levelComplete') {
    const hardest = getHardestQuestionIds(3);

    return (
      <div className="app-page">
        <TopBar title="Savladaj sva pitanja" showBack />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-6xl">emoji_events</span>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface mt-3">Nivo {challenge.level} završen</h2>
          <p className="text-on-surface-variant mt-2">Svih 170 pitanja savladano na ovom nivou.</p>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <div className="app-card-soft p-3">
              <p className="text-xl font-bold text-success">{levelStats.correct}</p>
              <p className="text-[11px] text-on-surface-variant">Tačnih</p>
            </div>
            <div className="app-card-soft p-3">
              <p className="text-xl font-bold text-error">{levelStats.wrong}</p>
              <p className="text-[11px] text-on-surface-variant">Grešaka</p>
            </div>
            <div className="app-card-soft p-3">
              <p className="text-xl font-bold text-primary">{challenge.bestStreak || streak}</p>
              <p className="text-[11px] text-on-surface-variant">Najduži streak</p>
            </div>
          </div>

          {hardest.length > 0 && (
            <div className="mt-6 text-left">
              <p className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wide mb-2">
                Najteža pitanja
              </p>
              {hardest.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-on-surface">#{h.id}</span>
                  <span className="text-error font-semibold">{h.wrong} grešaka</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 p-4 rounded-xl bg-primary-container/40">
            <p className="font-headline font-bold text-primary">Otključan Nivo {Math.min(challenge.level + 1, TOTAL_LEVELS)}</p>
          </div>

          <Button onClick={handleAdvanceLevel} className="w-full mt-6">Nastavi</Button>
        </section>
      </div>
    );
  }

  /* ---------------------------- CHALLENGE COMPLETE ---------------------------- */
  if (view === 'challengeComplete') {
    const practiceStats = getPracticeStats();
    const hardest = getHardestQuestionIds(5);

    return (
      <div className="app-page">
        <TopBar title="Savladaj sva pitanja" showBack />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-7xl">workspace_premium</span>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface mt-3">Sva pitanja savladana</h2>
          <p className="text-on-surface-variant mt-2">
            {challenge.completedRounds} / {challenge.completedRounds} kompletnih krugova
          </p>
          <span className="inline-block mt-4 px-4 py-1.5 bg-tertiary-container/40 text-tertiary font-bold rounded-full text-sm">
            Izazov završen
          </span>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="app-card-soft p-4">
              <p className="text-xl font-bold text-success">{practiceStats.totalCorrect}</p>
              <p className="text-[11px] text-on-surface-variant">Tačnih odgovora</p>
            </div>
            <div className="app-card-soft p-4">
              <p className="text-xl font-bold text-error">{practiceStats.totalWrong}</p>
              <p className="text-[11px] text-on-surface-variant">Ukupno grešaka</p>
            </div>
            <div className="app-card-soft p-4">
              <p className="text-xl font-bold text-primary">{challenge.bestStreak}</p>
              <p className="text-[11px] text-on-surface-variant">Najbolji streak</p>
            </div>
            <div className="app-card-soft p-4">
              <p className="text-xl font-bold text-on-surface">{practiceStats.totalAnswered}</p>
              <p className="text-[11px] text-on-surface-variant">Ukupno odgovora</p>
            </div>
          </div>

          {hardest.length > 0 && (
            <div className="mt-6 text-left">
              <p className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wide mb-2">
                Najteža pitanja
              </p>
              {hardest.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-sm py-1.5">
                  <span className="text-on-surface">#{h.id}</span>
                  <span className="text-error font-semibold">{h.wrong} grešaka</span>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={() => {
              resetMastered();
              advanceLevel();
              setChallenge(getChallenge());
              setLevelStats({ correct: 0, wrong: 0, answered: 0 });
              setView('intro');
            }}
            className="w-full mt-8"
          >
            Pokreni novi krug
          </Button>
        </section>
      </div>
    );
  }

  /* --------------------------------- PLAYING ---------------------------------- */
  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const answeredInRound = roundResults.length;

  return (
    <div className="app-page">
      <TopBar title="Savladaj sva pitanja" showBack />

      <section className="sticky top-[64px] z-40 bg-surface pt-3 pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 mb-4 border-b border-outline-variant/20">
        <div className="flex justify-between items-end mb-2">
          <span className="font-headline font-extrabold text-on-surface">
            {answeredInRound + (revealed ? 1 : 0)}{' '}
            <span className="text-on-surface-variant font-medium text-sm">od {ROUND_SIZE}</span>
          </span>
          {streak > 0 && (
            <span className="text-sm font-semibold text-success flex items-center gap-1">
              <span className="material-symbols-outlined text-base">local_fire_department</span>
              {streak} tačnih zaredom
            </span>
          )}
        </div>
        <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-1">
          <div
            className="h-full progress-bar-fill rounded-full transition-all duration-300"
            style={{ width: `${((answeredInRound + (revealed ? 1 : 0)) / ROUND_SIZE) * 100}%` }}
          />
        </div>
        <p className="text-xs text-on-surface-variant mt-2 font-semibold">
          Nivo {challenge.level} — {countMastered()} / {TOTAL_QUESTIONS} savladano
        </p>
      </section>

      <article key={currentQuestion.id} className="app-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
            Pitanje {currentQuestion.id}
          </span>
          {revealed && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selected === currentQuestion.correctAnswer ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}
            >
              {selected === currentQuestion.correctAnswer ? 'Tačno' : 'Netačno'}
            </span>
          )}
        </div>

        <h3 className="font-headline font-bold text-lg text-on-surface mb-5 leading-relaxed">{currentQuestion.text}</h3>

        <div className="grid gap-3">
          {currentQuestion.answers.map((answer) => {
            const isCorrect = answer.letter === currentQuestion.correctAnswer;
            const isSelected = selected === answer.letter;

            let optionClass = 'bg-surface-container-lowest border-outline-variant/25 hover:bg-surface-container-low';
            let icon = null;

            if (revealed && isCorrect) {
              optionClass = 'bg-success/10 border-success/55';
              icon = <span className="material-symbols-outlined text-success">check_circle</span>;
            } else if (revealed && isSelected && !isCorrect) {
              optionClass = 'bg-error/10 border-error/55';
              icon = <span className="material-symbols-outlined text-error">cancel</span>;
            } else if (isSelected) {
              optionClass = 'bg-primary-container/25 border-primary/65';
            }

            return (
              <button
                key={answer.letter}
                type="button"
                onClick={() => handleSelect(answer.letter)}
                className={`w-full min-h-[4.75rem] p-4 rounded-xl flex items-center gap-4 border text-left transition-all ${optionClass}`}
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                    revealed && isCorrect
                      ? 'bg-success text-white'
                      : revealed && isSelected && !isCorrect
                        ? 'bg-error text-white'
                        : isSelected
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  {answer.letter}
                </span>
                <span className="flex-1 text-on-surface font-medium">{answer.text}</span>
                {icon}
              </button>
            );
          })}
        </div>
      </article>

      {revealed && (
        <div className="fixed bottom-0 left-0 w-full border-t border-outline-variant/20 bg-white/88 backdrop-blur-xl z-50">
          <div
            className="app-fixed-inner"
            style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={handleNext}
              className="w-full gradient-primary text-white font-headline font-bold text-lg py-4 px-8 rounded-xl shadow-card active:scale-95 transition-transform flex items-center justify-center gap-3"
            >
              Dalje
              <span className="material-symbols-outlined">trending_flat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
