import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { questionsData } from '../data/questions';
import { shuffleArray, preparePracticeQuestions } from '../utils/parser';
import { recordAnswer } from '../utils/questionStats';
import {
  getRecordBest,
  setRecordBest,
  addRecordAttempt,
  getRecordAttempts,
  getRecordActive,
  setRecordActive,
  clearRecordActive,
  MAX_QUESTIONS
} from '../utils/recordStorage';

const VIEWS = {
  INTRO: 'intro',
  PLAYING: 'playing',
  ENDED: 'ended',
  PERFECT: 'perfect'
};

const MOTIVATION = [
  'Sledeći pokušaj može biti novi rekord.',
  'Nastavi sa vežbom — rekord je sve bliže.',
  'Još jedan pokušaj?',
  'Samo napred, iskustvo se stvara pokušajima.'
];

function shuffleAnswers(question) {
  return preparePracticeQuestions([question])[0];
}

export default function RecordScreen() {
  const navigate = useNavigate();
  const [view, setView] = useState(VIEWS.INTRO);
  const [best, setBest] = useState(() => getRecordBest());
  const [queue, setQueue] = useState([]); // prepared questions
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answeredIds, setAnsweredIds] = useState(new Set());
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [lastWasRecord, setLastWasRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState(null);
  const [endedQuestion, setEndedQuestion] = useState(null);
  const [motivation] = useState(() => MOTIVATION[Math.floor(Math.random() * MOTIVATION.length)]);
  const advanceTimer = useRef(null);

  // Resume active attempt if present (refresh / accidental close).
  useEffect(() => {
    const active = getRecordActive();
    if (active && active.questionIds && active.questionIds.length > 0 && active.index < active.questionIds.length) {
      const ordered = active.questionIds
        .map((id) => questionsData.find((q) => q.id === id))
        .filter(Boolean);
      const prepared = ordered.map(shuffleAnswers);
      setQueue(prepared);
      setIndex(active.index);
      setStreak(active.streak || 0);
      setAnsweredIds(new Set(active.answeredIds || []));
      setView(VIEWS.PLAYING);
    }
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  // Persist active state whenever it changes.
  useEffect(() => {
    if (view !== VIEWS.PLAYING) return;
    setRecordActive({
      questionIds: queue.map((q) => q.id),
      index,
      streak,
      answeredIds: [...answeredIds]
    });
  }, [view, queue, index, streak, answeredIds]);

  const startAttempt = useCallback(() => {
    const shuffledIds = shuffleArray(questionsData).map((q) => q.id);
    const ordered = shuffledIds.map((id) => questionsData.find((q) => q.id === id)).filter(Boolean);
    const prepared = ordered.map(shuffleAnswers);
    setQueue(prepared);
    setIndex(0);
    setStreak(0);
    setAnsweredIds(new Set());
    setSelected(null);
    setRevealed(false);
    setView(VIEWS.PLAYING);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelect = (letter) => {
    if (revealed) return;
    const question = queue[index];
    setSelected(letter);
    setRevealed(true);

    const isCorrect = letter === question.correctAnswer;
    recordAnswer(question.id, isCorrect ? 'correct' : 'wrong');

    const newStreak = isCorrect ? streak + 1 : streak;
    const newAnswered = new Set(answeredIds);
    newAnswered.add(question.id);
    setAnsweredIds(newAnswered);

    if (isCorrect) {
      setStreak(newStreak);
      // Auto-advance after brief feedback.
      if (newStreak >= MAX_QUESTIONS) {
        // Perfect run.
        finishAttempt(newStreak, null, question);
        return;
      }
      advanceTimer.current = setTimeout(() => {
        const nextIndex = index + 1;
        setIndex(nextIndex);
        setSelected(null);
        setRevealed(false);
      }, 300);
    } else {
      // Wrong ends the attempt.
      finishAttempt(newStreak, question, question);
    }
  };

  const finishAttempt = useCallback((finalStreak, failedQuestion, currentQuestion) => {
    const prevBest = getRecordBest();
    let isRecord = false;
    let isPerfect = finalStreak >= MAX_QUESTIONS;

    if (prevBest == null) {
      // First attempt.
      if (finalStreak > 0) {
        setRecordBest(finalStreak);
        isRecord = true;
      }
    } else if (finalStreak > prevBest) {
      setRecordBest(finalStreak);
      isRecord = true;
    }

    addRecordAttempt({
      date: new Date().toISOString(),
      streak: finalStreak,
      failedQuestionId: failedQuestion ? failedQuestion.id : null,
      isRecord,
      isPerfect
    });

    clearRecordActive();
    setBest(getRecordBest());
    setPreviousBest(prevBest);
    setLastWasRecord(isRecord);
    setEndedQuestion(failedQuestion || currentQuestion);
    setView(isPerfect ? VIEWS.PERFECT : VIEWS.ENDED);
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const handleQuit = useCallback(() => {
    if (view === VIEWS.PLAYING) {
      const confirm = window.confirm(
        'Napustiti trenutni pokušaj?\n\nTrenutni niz neće biti upisan kao završen rezultat.'
      );
      if (!confirm) return;
    }
    clearRecordActive();
    navigate('/');
  }, [view, navigate]);

  /* ----------------------------------- INTRO ---------------------------------- */
  if (view === VIEWS.INTRO) {
    const attempts = getRecordAttempts();
    return (
      <div className="app-page">
        <TopBar title="Igraj za rekord" showBack />
        <section className="mb-6 mt-5 app-card p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-error/15 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-error text-3xl">whatshot</span>
          </div>
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Igraj za rekord</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Koliko pitanja možeš da rešiš tačno zaredom?
          </p>

          <div className="mt-5 p-4 rounded-xl bg-primary-container/40">
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Lični rekord</p>
            <p className="font-headline text-3xl font-extrabold text-primary mt-1">
              {best == null ? '—' : `${best}${best >= MAX_QUESTIONS ? ` / ${MAX_QUESTIONS}` : ''}`}
            </p>
            {best != null && best >= MAX_QUESTIONS && (
              <p className="text-xs font-bold text-success mt-1">Izazov kompletiran</p>
            )}
          </div>

          {attempts.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">
                Poslednji pokušaji
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {attempts.slice(0, 8).map((a, i) => (
                  <span
                    key={i}
                    className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                      a.isRecord
                        ? 'bg-success/15 text-success'
                        : a.isPerfect
                          ? 'bg-primary/15 text-primary'
                          : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {a.streak}
                    {a.isRecord ? ' 🏆' : ''}
                  </span>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant mt-3">
                Broj pokušaja: {attempts.length}
              </p>
            </div>
          )}
        </section>

        <section className="pb-8">
          <Button onClick={startAttempt} size="lg" className="w-full">
            {getRecordActive() ? 'Nastavi pokušaj' : 'Započni pokušaj'}
          </Button>
          <button
            onClick={() => navigate('/')}
            className="w-full mt-3 text-sm font-semibold text-on-surface-variant hover:text-on-surface py-2"
          >
            Nazad na početnu
          </button>
        </section>
      </div>
    );
  }

  /* --------------------------------- PLAYING ---------------------------------- */
  if (view === VIEWS.PLAYING) {
    const question = queue[index];
    if (!question) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      );
    }

    const isNewRecord = best != null && streak > best;
    const tiedRecord = best != null && streak === best && streak > 0;

    return (
      <div className="app-page">
        <TopBar title="Igraj za rekord" showBack onBack={handleQuit} />

        <section className="sticky top-[64px] z-40 bg-surface pt-3 pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 mb-4 border-b border-outline-variant/20">
          <div className="flex items-end justify-between mb-1">
            <span className="font-headline text-3xl font-extrabold text-on-surface">
              {streak}
              <span className="text-base font-semibold text-on-surface-variant ml-1">tačnih zaredom</span>
            </span>
            <span className="text-sm font-semibold text-on-surface-variant">
              Pitanje {index + 1} / {MAX_QUESTIONS}
            </span>
          </div>

          {best != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-on-surface-variant font-medium">Lični rekord: {best}</span>
              {isNewRecord && (
                <span className="text-success font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">emoji_events</span>
                  Novi rekord!
                </span>
              )}
              {tiedRecord && !isNewRecord && (
                <span className="text-primary font-bold">Izjednačeno!</span>
              )}
            </div>
          )}

          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden p-0.5 mt-2">
            <div
              className="h-full progress-bar-fill rounded-full transition-all duration-300"
              style={{ width: `${(streak / MAX_QUESTIONS) * 100}%` }}
            />
          </div>
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

        {revealed && selected === question.correctAnswer && (
          <div className="fixed bottom-0 left-0 w-full border-t border-outline-variant/20 bg-white/88 backdrop-blur-xl z-50">
            <div
              className="app-fixed-inner"
              style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
            >
              <p className="text-center font-headline font-bold text-success text-lg mb-2">
                Tačno! Niz: {streak}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ------------------------------- PERFECT SCREEN ------------------------------ */
  if (view === VIEWS.PERFECT) {
    return (
      <div className="app-page">
        <TopBar title="Igraj za rekord" showBack onBack={() => navigate('/')} />
        <section className="app-card p-8 text-center mt-6 animate-scale-in">
          <span className="material-symbols-outlined text-primary text-7xl">workspace_premium</span>
          <h2 className="font-headline text-3xl font-extrabold text-on-surface mt-3">Čestitamo!</h2>
          <p className="font-headline font-bold text-xl text-success mt-3">
            Apsolutno ste spremni za prijemni ispit!
          </p>
          <p className="text-2xl font-extrabold text-primary mt-4">
            {MAX_QUESTIONS} / {MAX_QUESTIONS} pitanja tačno
          </p>
          <p className="text-sm text-on-surface-variant mt-1">Bez ijedne greške.</p>

          <div className="mt-6 p-4 rounded-xl bg-primary-container/40">
            <p className="text-xs font-semibold text-primary/70 uppercase tracking-wide">Lični rekord</p>
            <p className="font-headline text-3xl font-extrabold text-primary mt-1">
              {MAX_QUESTIONS} / {MAX_QUESTIONS}
            </p>
            <p className="text-xs font-bold text-success mt-1">Izazov kompletiran</p>
          </div>

          <div className="flex flex-col gap-3 mt-8">
            <Button onClick={startAttempt} className="w-full">Igraj ponovo</Button>
            <Button onClick={() => navigate('/')} variant="ghost" className="w-full">Završi za sada</Button>
          </div>
        </section>
      </div>
    );
  }

  /* -------------------------------- END SCREEN -------------------------------- */
  const finalStreak = streak;
  const prevBest = previousBest;
  const wasFirstEver = prevBest == null;
  const isRecord = lastWasRecord;
  const tiedRecord = !isRecord && prevBest != null && finalStreak === prevBest && finalStreak > 0;
  const beatRecord = isRecord && !wasFirstEver;
  const isFirstRecord = isRecord && wasFirstEver && finalStreak > 0;
  const noRecordMessage = !isRecord && !tiedRecord && finalStreak === 0;

  let title = 'Dobar pokušaj!';
  let subtitle = motivation;

  if (isFirstRecord) {
    title = 'Postavili ste lični rekord!';
    subtitle = `Vaš prvi rekord je ${finalStreak} tačnih odgovora zaredom.`;
  } else if (beatRecord) {
    title = 'Novi lični rekord!';
    subtitle = `${finalStreak} tačnih odgovora zaredom`;
  } else if (tiedRecord) {
    title = 'Izjednačili ste lični rekord!';
    subtitle = `Još jedno tačno pitanje i bio bi novi rekord.`;
  } else if (noRecordMessage) {
    title = 'Prvi rezultat je zabeležen';
    subtitle = 'Sledeći pokušaj je prilika za prvi niz tačnih odgovora.';
  } else if (!isRecord && !tiedRecord && prevBest != null) {
    const diff = prevBest - finalStreak;
    subtitle = `${motivation} Do rekorda je nedostajalo još ${diff}.`;
  }

  return (
    <div className="app-page">
      <TopBar title="Igraj za rekord" showBack onBack={() => navigate('/')} />
      <section className="app-card p-8 text-center mt-6 animate-scale-in">
        <span
          className={`material-symbols-outlined text-6xl ${
            isRecord || tiedRecord ? 'text-success' : finalStreak === 0 ? 'text-on-surface-variant' : 'text-primary'
          }`}
        >
          {isRecord || tiedRecord ? 'emoji_events' : finalStreak === 0 ? 'info' : 'flag'}
        </span>
        <h2 className="font-headline text-2xl font-extrabold text-on-surface mt-3">{title}</h2>
        <p className="font-headline font-bold text-3xl text-primary mt-2">{finalStreak} tačnih zaredom</p>

        {beatRecord && (
          <p className="text-sm text-on-surface-variant mt-2">Prethodni rekord: <span className="font-bold text-on-surface">{prevBest}</span></p>
        )}
        {tiedRecord && (
          <p className="text-sm text-on-surface-variant mt-2">Rekord ostaje: <span className="font-bold text-on-surface">{prevBest}</span></p>
        )}
        {!isRecord && !tiedRecord && prevBest != null && (
          <p className="text-sm text-on-surface-variant mt-2">Lični rekord: <span className="font-bold text-on-surface">{prevBest}</span></p>
        )}

        <p className="text-sm text-on-surface-variant mt-3">{subtitle}</p>

        {/* The failed question */}
        {endedQuestion && (
          <div className="mt-6 text-left">
            <p className="font-headline font-bold text-sm text-on-surface-variant uppercase tracking-wide mb-2">
              Pogrešili ste na pitanju {endedQuestion.id}
            </p>
            <div className="app-card-soft p-4">
              <p className="font-headline font-bold text-sm text-on-surface mb-3">{endedQuestion.text}</p>

              {selected && (
                <div className="rounded-xl bg-error/5 border border-error/20 p-3 mb-2">
                  <p className="text-xs font-semibold text-error mb-1">Vaš odgovor</p>
                  <p className="text-sm text-on-surface">
                    {selected}. {endedQuestion.answers.find((a) => a.letter === selected)?.text || ''}
                  </p>
                </div>
              )}
              <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                <p className="text-xs font-semibold text-success mb-1">Tačan odgovor</p>
                <p className="text-sm text-on-surface">
                  {endedQuestion.correctAnswer}. {endedQuestion.answers.find((a) => a.letter === endedQuestion.correctAnswer)?.text || ''}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 mt-8">
          <Button onClick={startAttempt} className="w-full">Pokušaj ponovo</Button>
          <Button onClick={() => navigate('/')} variant="ghost" className="w-full">Završi za sada</Button>
        </div>
      </section>
    </div>
  );
}
