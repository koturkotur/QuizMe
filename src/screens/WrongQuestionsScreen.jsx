import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { questionsData } from '../data/questions';
import { shuffleArray, preparePracticeQuestions } from '../utils/parser';
import { buildSmartOrder } from '../utils/questionSelector';
import { getAllQuestionStats } from '../utils/questionStats';
import {
  getActiveWrongQuestionIds,
  getRecoveryProgress,
  bumpRecovery,
  resetRecovery,
  recordAnswer,
  recordWrongCycleAnswer,
  incrementWrongCycleRound,
  addMasteredToCycle,
  completeWrongCycle,
  startWrongCycle,
  getActiveWrongCycle,
  getWrongSummary,
  RECOVERY_TARGET_COUNT
} from '../utils/questionStats';

const VIEWS = {
  INTRO: 'intro',
  PLAYING: 'playing',
  ROUND_SUMMARY: 'roundSummary',
  CYCLE_COMPLETE: 'cycleComplete'
};

function shuffleAnswers(question) {
  return preparePracticeQuestions([question])[0];
}

export default function WrongQuestionsScreen() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(() => getWrongSummary());
  const [view, setView] = useState(VIEWS.INTRO);

  // Round state
  const [roundQuestions, setRoundQuestions] = useState([]); // prepared questions for current round
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [roundResults, setRoundResults] = useState([]); // [{ question, isCorrect }]
  const [currentRecovery, setCurrentRecovery] = useState(0); // recovery progress of current question

  // Refresh summary on mount and whenever we return to intro.
  useEffect(() => {
    if (view === VIEWS.INTRO) {
      setSummary(getWrongSummary());
    }
  }, [view]);

  const activeIds = useMemo(() => new Set(getActiveWrongQuestionIds()), [summary]);
  const statsMap = useMemo(() => getAllQuestionStats(), [summary]);

  // Build a round from currently active wrong questions, ordered by difficulty.
  const startRound = useCallback(() => {
    const ids = getActiveWrongQuestionIds();
    if (ids.length === 0) {
      setView(VIEWS.CYCLE_COMPLETE);
      return;
    }

    // Smart order: harder first, but only active wrong questions.
    const ordered = buildSmartOrder(questionsData).filter((q) => ids.includes(q.id));
    const shuffledOnce = shuffleArray(ordered);
    const prepared = shuffledOnce.map(shuffleAnswers);

    setRoundQuestions(prepared);
    setRoundIndex(0);
    setRoundResults([]);
    setSelected(null);
    setRevealed(false);
    setCurrentRecovery(getRecoveryProgress(prepared[0].id));
    incrementWrongCycleRound();
    setView(VIEWS.PLAYING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelect = (letter) => {
    if (revealed) return;
    const question = roundQuestions[roundIndex];
    setSelected(letter);
    setRevealed(true);

    const isCorrect = letter === question.correctAnswer;
    const outcome = isCorrect ? 'correct' : 'wrong';

    // Record into global stats (this also activates wrong if wrong, but we handle recovery here).
    recordAnswer(question.id, outcome);
    recordWrongCycleAnswer(isCorrect, question.id);

    let newProgress = getRecoveryProgress(question.id);

    if (isCorrect) {
      const result = bumpRecovery(question.id);
      newProgress = result.progress;
      if (result.mastered) {
        addMasteredToCycle(question.id);
      }
    } else {
      resetRecovery(question.id);
      newProgress = 0;
    }

    setCurrentRecovery(newProgress);
    setRoundResults((prev) => [...prev, { question, isCorrect, recovery: newProgress, mastered: isCorrect && newProgress >= RECOVERY_TARGET_COUNT }]);
    setSummary(getWrongSummary());

    // Auto-advance on correct answer after brief feedback; wrong stays for "Dalje".
    if (isCorrect) {
      setTimeout(() => handleNext(), 500);
    }
  };

  const handleNext = useCallback(() => {
    const nextIndex = roundIndex + 1;

    if (nextIndex >= roundQuestions.length) {
      // Round finished.
      setView(VIEWS.ROUND_SUMMARY);
      return;
    }

    setRoundIndex(nextIndex);
    setSelected(null);
    setRevealed(false);
    const nextQ = roundQuestions[nextIndex];
    setCurrentRecovery(getRecoveryProgress(nextQ.id));
  }, [roundIndex, roundQuestions.length]);

  const handleContinueWithRemaining = useCallback(() => {
    const remaining = getActiveWrongQuestionIds();
    if (remaining.length === 0) {
      // All mastered → cycle complete.
      completeWrongCycle();
      setSummary(getWrongSummary());
      setView(VIEWS.CYCLE_COMPLETE);
      return;
    }
    startRound();
  }, [startRound]);

  const handleStopForNow = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleBackToIntro = useCallback(() => {
    setSummary(getWrongSummary());
    setView(VIEWS.INTRO);
  }, []);

  /* ---------------------------------- INTRO ---------------------------------- */
  if (view === VIEWS.INTRO) {
    if (summary.activeCount === 0) {
      return (
        <div className="app-page">
          <TopBar title="Vežbaj pogrešena pitanja" showBack />
          <section className="mt-6 app-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-success/15 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-success text-3xl">task_alt</span>
            </div>
            <h3 className="font-headline font-bold text-lg text-on-surface">
              Sva pogrešena pitanja su trenutno savladana
            </h3>
            <p className="text-sm text-on-surface-variant mt-2 max-w-xs mx-auto">
              Trenutno nema pitanja za ponavljanje. Pitanja na koja pogrešno odgovoriš u testu, vežbanju ili izazovu pojaviće se ovde.
            </p>

            {summary.totalMastered > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="app-card-soft p-4">
                  <p className="text-2xl font-bold text-success">{summary.totalMastered}</p>
                  <p className="text-[11px] text-on-surface-variant">Ukupno savladana</p>
                </div>
                <div className="app-card-soft p-4">
                  <p className="text-2xl font-bold text-on-surface">{summary.completedCycles}</p>
                  <p className="text-[11px] text-on-surface-variant">Završenih ciklusa</p>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="mt-6 gradient-primary text-white font-bold py-3 px-8 rounded-xl shadow-card active:scale-95 transition-transform"
            >
              Nazad na početnu
            </button>
          </section>
        </div>
      );
    }

    const cycleProgress = summary.hasActiveCycle
      ? `${summary.cycleMasteredCount} / ${summary.cycleInitialCount}`
      : `0 / ${summary.activeCount}`;

    const cycleProgressPct = summary.hasActiveCycle && summary.cycleInitialCount > 0
      ? Math.round((summary.cycleMasteredCount / summary.cycleInitialCount) * 100)
      : 0;

    return (
      <div className="app-page">
        <TopBar title="Vežbaj pogrešena pitanja" showBack />

        <section className="mb-6 mt-5 app-card p-6">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Vežbaj pogrešena pitanja</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Fokusiraj se na pitanja koja ti najteže idu. Odgovori tačno 3 puta zaredom na svako pitanje da bi ga savladao.
          </p>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-headline font-bold text-on-surface">Trenutno za vežbanje</span>
              <span className="text-2xl font-extrabold text-error">{summary.activeCount}</span>
            </div>

            {summary.hasActiveCycle && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-on-surface-variant">Ciklus — savladano</span>
                  <span className="text-sm font-semibold text-primary">{cycleProgress}</span>
                </div>
                <div className="h-2.5 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full progress-bar-fill transition-all"
                    style={{ width: `${cycleProgressPct}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="app-card-soft p-3 text-center">
              <p className="text-lg font-bold text-success">{summary.totalMastered}</p>
              <p className="text-[11px] text-on-surface-variant">Ukupno savladana</p>
            </div>
            <div className="app-card-soft p-3 text-center">
              <p className="text-lg font-bold text-on-surface">{summary.completedCycles}</p>
              <p className="text-[11px] text-on-surface-variant">Završenih ciklusa</p>
            </div>
          </div>

          {summary.lastCycle && (
            <p className="text-xs text-on-surface-variant mt-4">
              Poslednji ciklus: {summary.lastCycle.initialCount} pitanja · {summary.lastCycle.rounds} runde
            </p>
          )}
        </section>

        <section className="pb-8">
          <Button onClick={startRound} size="lg" className="w-full">
            {summary.hasActiveCycle ? 'Nastavi sa preostalim' : 'Započni rundu'}
          </Button>
        </section>
      </div>
    );
  }

  /* ------------------------------ ROUND SUMMARY ------------------------------ */
  if (view === VIEWS.ROUND_SUMMARY) {
    const roundCorrect = roundResults.filter((r) => r.isCorrect).length;
    const roundWrong = roundResults.length - roundCorrect;
    const masteredThisRound = roundResults.filter((r) => r.mastered).length;
    const remainingNow = getActiveWrongQuestionIds().length;

    const cycle = getActiveWrongCycle();
    const cycleMastered = cycle ? (cycle.masteredInCycle || []).length : 0;
    const cycleInitial = cycle ? cycle.initialCount : roundResults.length;

    return (
      <div className="app-page">
        <TopBar title="Vežbaj pogrešena pitanja" showBack />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-5xl">flag</span>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface mt-3">Runda završena</h2>

          <p className="text-sm text-on-surface-variant mt-2">{roundResults.length} pitanja obrađeno</p>

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

          <div className="mt-5 p-4 rounded-xl bg-success/10">
            <p className="text-sm font-semibold text-success">{masteredThisRound} pitanja savladana ove runde</p>
          </div>

          <div className="mt-5">
            <p className="font-headline font-bold text-lg text-on-surface">{remainingNow} pitanja ostaje za vežbanje</p>
            <div className="h-2.5 bg-surface-container rounded-full overflow-hidden mt-3">
              <div
                className="h-full progress-bar-fill transition-all"
                style={{ width: `${cycleInitial > 0 ? Math.round((cycleMastered / cycleInitial) * 100) : 0}%` }}
              />
            </div>
            <p className="text-xs text-on-surface-variant mt-2 font-semibold">
              Ciklus — {cycleMastered} / {cycleInitial} savladano
            </p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            {remainingNow > 0 ? (
              <Button onClick={handleContinueWithRemaining} className="w-full">Nastavi sa preostalim</Button>
            ) : (
              <Button onClick={handleContinueWithRemaining} className="w-full">Završi ciklus</Button>
            )}
            <Button onClick={handleStopForNow} variant="ghost" className="w-full">Završi za sada</Button>
          </div>
        </section>
      </div>
    );
  }

  /* ----------------------------- CYCLE COMPLETE ----------------------------- */
  if (view === VIEWS.CYCLE_COMPLETE) {
    const completedCycles = getActiveWrongCycle();
    // Cycle was just completed; fetch from history instead.
    const allCycles = JSON.parse(localStorage.getItem('quizme_wrong_cycles') || '[]');
    const last = allCycles[allCycles.length - 1];

    return (
      <div className="app-page">
        <TopBar title="Vežbaj pogrešena pitanja" showBack />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-success text-6xl">workspace_premium</span>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface mt-3">Sva pogrešena pitanja savladana</h2>

          {last && (
            <>
              <p className="font-headline font-bold text-2xl text-success mt-4">
                {last.initialCount} / {last.initialCount} savladano
              </p>
              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="app-card-soft p-4">
                  <p className="text-xl font-bold text-on-surface">{last.rounds}</p>
                  <p className="text-[11px] text-on-surface-variant">Rundi</p>
                </div>
                <div className="app-card-soft p-4">
                  <p className="text-xl font-bold text-on-surface">{last.totalAnswers}</p>
                  <p className="text-[11px] text-on-surface-variant">Ukupno odgovora</p>
                </div>
                <div className="app-card-soft p-4">
                  <p className="text-xl font-bold text-success">{last.correct}</p>
                  <p className="text-[11px] text-on-surface-variant">Tačnih</p>
                </div>
                <div className="app-card-soft p-4">
                  <p className="text-xl font-bold text-error">{last.wrong}</p>
                  <p className="text-[11px] text-on-surface-variant">Grešaka</p>
                </div>
              </div>

              {last.hardestQuestionId && (
                <p className="text-sm text-on-surface-variant mt-5">
                  Najteže pitanje: #{last.hardestQuestionId}
                </p>
              )}

              <p className="text-xs text-on-surface-variant mt-3">
                Uspešnost: {last.percentage}%
              </p>
            </>
          )}

          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={handleBackToIntro} className="w-full">Nazad</Button>
            <Button onClick={handleStopForNow} variant="ghost" className="w-full">Nazad na početnu</Button>
          </div>
        </section>
      </div>
    );
  }

  /* --------------------------------- PLAYING --------------------------------- */
  const question = roundQuestions[roundIndex];

  if (!question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const answeredInRound = roundResults.length;
  const roundTotal = roundQuestions.length;

  return (
    <div className="app-page">
      <TopBar title="Vežbaj pogrešena pitanja" showBack />

      <section className="sticky top-[64px] z-40 bg-surface pt-3 pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 mb-4 border-b border-outline-variant/20">
        <div className="flex justify-between items-end mb-2">
          <span className="font-headline font-extrabold text-on-surface">
            {answeredInRound + (revealed ? 1 : 0)}{' '}
            <span className="text-on-surface-variant font-medium text-sm">od {roundTotal}</span>
          </span>
          <span className="text-sm font-semibold text-on-surface-variant">
            Preostalo: {summary.activeCount}
          </span>
        </div>
        <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-1">
          <div
            className="h-full progress-bar-fill rounded-full transition-all duration-300"
            style={{ width: `${((answeredInRound + (revealed ? 1 : 0)) / roundTotal) * 100}%` }}
          />
        </div>
      </section>

      <article key={question.id} className="app-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-error/10 text-error font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
            Pitanje {question.id}
          </span>
          {revealed && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                selected === question.correctAnswer ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
              }`}
            >
              {selected === question.correctAnswer ? 'Tačno' : 'Netačno'}
            </span>
          )}
        </div>

        <h3 className="font-headline font-bold text-lg text-on-surface mb-5 leading-relaxed">{question.text}</h3>

        <div className="grid gap-3">
          {question.answers.map((answer) => {
            const isCorrect = answer.letter === question.correctAnswer;
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

        {/* Recovery progress indicator */}
        {revealed && (
          <div className={`mt-5 p-4 rounded-xl text-center animate-fade-in ${
            selected === question.correctAnswer
              ? currentRecovery >= RECOVERY_TARGET_COUNT
                ? 'bg-success/10'
                : 'bg-primary-container/30'
              : 'bg-error/5'
          }`}>
            {selected === question.correctAnswer ? (
              currentRecovery >= RECOVERY_TARGET_COUNT ? (
                <p className="font-headline font-bold text-success">
                  3 / 3 — Savladano
                </p>
              ) : (
                <p className="font-headline font-bold text-primary">
                  {currentRecovery} / {RECOVERY_TARGET_COUNT} do savladavanja
                </p>
              )
            ) : (
              <p className="font-headline font-bold text-error">
                0 / {RECOVERY_TARGET_COUNT} do savladavanja
              </p>
            )}
          </div>
        )}
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
