import React, { useState, useCallback } from 'react';
import TopBar from './TopBar';
import Button from './Button';
import { preparePracticeQuestions, ANSWER_LETTERS } from '../utils/parser';
import { recordAnswer } from '../utils/questionStats';

const ROUND_SIZE = 10;

/**
 * Reusable single-question-at-a-time quiz runner with instant feedback.
 *
 * Props:
 *  - title: string
 *  - sourceQuestions: Question[] (already ordered/filtered by the caller)
 *  - onAnswer: (question, outcome) => void  (called for stats/side-effects)
 *  - onRoundComplete: (roundStats) => void (called after every 10 answers)
 *  - onFinish: () => void (called when source is exhausted or user stops)
 *  - getProgressInfo: () => { label, current, total, extra } (optional, for header)
 *  - streakTracking: boolean (default true)
 *  - emptyMessage: ReactNode (shown when sourceQuestions is empty)
 */
export default function QuizRunner({
  title,
  sourceQuestions,
  onAnswer,
  onRoundComplete,
  onFinish,
  getProgressInfo,
  streakTracking = true,
  emptyMessage
}) {
  const [questions] = useState(() => preparePracticeQuestions(sourceQuestions));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [roundResults, setRoundResults] = useState([]);
  const [streak, setStreak] = useState(0);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [finished, setFinished] = useState(false);

  const total = questions.length;

  if (total === 0) {
    return (
      <div className="app-page">
        <TopBar title={title} showBack />
        <div className="mt-10">{emptyMessage}</div>
      </div>
    );
  }

  const question = questions[index];
  const answeredInRound = roundResults.length;

  const progressInfo = getProgressInfo ? getProgressInfo() : null;

  const handleSelect = (letter) => {
    if (revealed) return;
    setSelected(letter);
    setRevealed(true);

    const isCorrect = letter === question.correctAnswer;
    const outcome = isCorrect ? 'correct' : 'wrong';

    if (streakTracking) {
      setStreak((prev) => (isCorrect ? prev + 1 : 0));
    }

    recordAnswer(question.id, outcome);
    if (onAnswer) onAnswer(question, outcome);

    setRoundResults((prev) => [...prev, { question, outcome, isCorrect }]);
  };

  const handleNext = useCallback(() => {
    const nextIndex = index + 1;
    const completedInThisRound = roundResults.length;

    if (completedInThisRound >= ROUND_SIZE) {
      // End of round
      setShowRoundSummary(true);
      return;
    }

    if (nextIndex >= total) {
      // No more questions at all
      setFinished(true);
      setShowRoundSummary(true);
      return;
    }

    setIndex(nextIndex);
    setSelected(null);
    setRevealed(false);
  }, [index, total, roundResults.length]);

  const startNextRound = () => {
    if (finished || index + 1 >= total) {
      if (onRoundComplete) onRoundComplete({ results: roundResults, finished: true });
      if (onFinish) onFinish();
      return;
    }

    if (onRoundComplete) onRoundComplete({ results: roundResults, finished: false });

    setRoundResults([]);
    setShowRoundSummary(false);
    setIndex((prev) => prev + 1);
    setSelected(null);
    setRevealed(false);
  };

  const handleStop = () => {
    if (onRoundComplete) onRoundComplete({ results: roundResults, finished: false });
    if (onFinish) onFinish();
  };

  const roundCorrect = roundResults.filter((r) => r.isCorrect).length;
  const roundWrong = roundResults.length - roundCorrect;
  const newlyMastered = onAnswer ? roundResults.filter((r) => r.isCorrect).length : roundCorrect;

  // Round summary screen
  if (showRoundSummary) {
    return (
      <div className="app-page">
        <TopBar title={title} showBack />
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

          {progressInfo && (
            <div className="mt-6">
              <p className="font-headline font-bold text-lg text-on-surface">
                {progressInfo.label}
              </p>
              <p className="text-sm text-on-surface-variant mt-1">
                {progressInfo.current} / {progressInfo.total} pitanja
              </p>
              <div className="h-2.5 bg-surface-container rounded-full overflow-hidden mt-3">
                <div
                  className="h-full progress-bar-fill transition-all"
                  style={{ width: `${Math.round((progressInfo.current / progressInfo.total) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-8">
            {!finished && (
              <Button onClick={startNextRound} className="w-full">
                Još 10
              </Button>
            )}
            <Button onClick={handleStop} variant="ghost" className="w-full">
              Završi za sada
            </Button>
          </div>
        </section>
      </div>
    );
  }

  // Main question screen
  return (
    <div className="app-page">
      <TopBar title={title} showBack />

      <section className="sticky top-[64px] z-40 bg-surface pt-3 pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 mb-4 border-b border-outline-variant/20">
        <div className="flex justify-between items-end mb-2">
          <span className="font-headline font-extrabold text-on-surface">
            {answeredInRound + (revealed ? 1 : 0)}{' '}
            <span className="text-on-surface-variant font-medium text-sm">od {ROUND_SIZE}</span>
          </span>
          {streakTracking && streak > 0 && (
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
        {progressInfo && (
          <p className="text-xs text-on-surface-variant mt-2 font-semibold">
            {progressInfo.label} — {progressInfo.current} / {progressInfo.total}
          </p>
        )}
      </section>

      <article key={question.id} className="app-card p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
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
