import React, { useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import { questionsData } from '../data/questions';
import { preparePracticeQuestions, shuffleArray } from '../utils/parser';
import { getTestHistory } from '../utils/storage';
import { recordAnswer } from '../utils/questionStats';

const MODE_INFO = {
  ordered: {
    title: 'Po redosledu',
    description: 'Kreneš od 1. pitanja i ideš redom kroz ceo set.'
  },
  shuffled: {
    title: 'Izmešana pitanja',
    description: 'Pitanja su nasumična, a odgovori su dodatno izmešani.'
  },
  weakest: {
    title: 'Najslabije oblasti',
    description: 'Prvo dobijaš pitanja na kojima je tvoja tačnost bila najniža.'
  }
};

function buildWeakestOrder(allQuestions, history) {
  const statsByQuestion = new Map();

  for (const test of history) {
    for (const answered of test.questions || []) {
      if (!answered || typeof answered.id !== 'number') {
        continue;
      }

      if (!statsByQuestion.has(answered.id)) {
        statsByQuestion.set(answered.id, { attempts: 0, correct: 0 });
      }

      const stats = statsByQuestion.get(answered.id);
      stats.attempts += 1;
      if (answered.isCorrect) {
        stats.correct += 1;
      }
    }
  }

  const attempted = [];
  const notAttempted = [];

  for (const q of allQuestions) {
    const stats = statsByQuestion.get(q.id);
    if (!stats) {
      notAttempted.push(q);
      continue;
    }

    attempted.push({
      question: q,
      accuracy: stats.correct / stats.attempts,
      attempts: stats.attempts
    });
  }

  attempted.sort((a, b) => {
    if (a.accuracy !== b.accuracy) {
      return a.accuracy - b.accuracy;
    }
    if (a.attempts !== b.attempts) {
      return b.attempts - a.attempts;
    }
    return a.question.id - b.question.id;
  });

  return [...attempted.map((x) => x.question), ...notAttempted];
}

export default function PracticeScreen() {
  const history = useMemo(() => getTestHistory(), []);
  const [mode, setMode] = useState(null);
  const [practiceQuestions, setPracticeQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  const startMode = (nextMode) => {
    let orderedQuestions = questionsData;

    if (nextMode === 'shuffled') {
      orderedQuestions = shuffleArray(questionsData);
    } else if (nextMode === 'weakest') {
      orderedQuestions = buildWeakestOrder(questionsData, history);
    }

    const prepared = preparePracticeQuestions(orderedQuestions);
    setMode(nextMode);
    setPracticeQuestions(prepared);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelect = (questionId, letter, question) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: letter
    }));

    // Feed per-question stats (only on first answer for this question in the session).
    if (!answers[questionId]) {
      const outcome = letter === question.correctAnswer ? 'correct' : 'wrong';
      recordAnswer(question.id, outcome);
    }
  };

  const answeredCount = Object.keys(answers).length;
  const hasHistory = history.length > 0;

  if (!mode) {
    return (
      <div className="app-page-wide">
        <TopBar title="Vežbaj sva pitanja" showBack />

        <section className="mb-6 mt-5 app-card p-5">
          <h2 className="font-headline text-2xl font-extrabold text-on-surface">Izaberi režim vežbanja</h2>
          <p className="text-sm text-on-surface-variant mt-2">
            Pregledaj i vežbaj svih 170 pitanja svojim tempom. Čim izabereš opciju odmah dobijaš povratnu informaciju i tačan odgovor.
          </p>
        </section>

        <section className="space-y-4 pb-8">
          <button
            type="button"
            onClick={() => startMode('ordered')}
            className="w-full app-card p-5 text-left hover:shadow-card-hover transition-all"
          >
            <p className="font-headline text-lg font-bold text-on-surface">{MODE_INFO.ordered.title}</p>
            <p className="text-sm text-on-surface-variant mt-1">{MODE_INFO.ordered.description}</p>
          </button>

          <button
            type="button"
            onClick={() => startMode('shuffled')}
            className="w-full app-card p-5 text-left hover:shadow-card-hover transition-all"
          >
            <p className="font-headline text-lg font-bold text-on-surface">{MODE_INFO.shuffled.title}</p>
            <p className="text-sm text-on-surface-variant mt-1">{MODE_INFO.shuffled.description}</p>
          </button>

          <button
            type="button"
            onClick={() => startMode('weakest')}
            className="w-full app-card p-5 text-left hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-headline text-lg font-bold text-on-surface">{MODE_INFO.weakest.title}</p>
              {!hasHistory && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-surface-container-low text-on-surface-variant">
                  Bez istorije
                </span>
              )}
            </div>
            <p className="text-sm text-on-surface-variant mt-1">{MODE_INFO.weakest.description}</p>
            {!hasHistory && (
              <p className="text-xs text-on-surface-variant mt-2">
                Još nema rezultata testova, pa će redosled za sada biti kao u bazi pitanja.
              </p>
            )}
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="app-page-wide">
      <TopBar title="Vežbaj sva pitanja" showBack />

      <section className="mb-6 mt-5 app-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl font-extrabold text-on-surface">Vežbaj sva pitanja</h2>
            <p className="text-sm text-on-surface-variant mt-2">Režim: {MODE_INFO[mode].title}</p>
          </div>
          <button
            type="button"
            onClick={() => setMode(null)}
            className="text-sm font-semibold text-primary hover:underline"
          >
            Promeni režim
          </button>
        </div>
        <p className="text-sm text-on-surface-variant mt-2">
          Odgovori su izmešani. Čim izabereš opciju, odmah dobijaš povratnu informaciju za to pitanje.
        </p>
        <p className="text-sm font-semibold text-primary mt-3">Odgovoreno: {answeredCount} / {practiceQuestions.length}</p>
      </section>

      <section className="space-y-5 pb-8">
        {practiceQuestions.map((question) => {
          const selected = answers[question.displayId] || null;

          return (
            <article key={question.displayId} className="app-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
                  Pitanje {question.displayId}
                </span>
                {selected && (
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
                  const hasAnswered = Boolean(selected);

                  let optionClass = 'bg-surface-container-lowest border-outline-variant/25 hover:bg-surface-container-low';
                  let icon = null;

                  if (hasAnswered && isCorrect) {
                    optionClass = 'bg-success/10 border-success/55';
                    icon = <span className="material-symbols-outlined text-success">check_circle</span>;
                  } else if (hasAnswered && isSelected && !isCorrect) {
                    optionClass = 'bg-error/10 border-error/55';
                    icon = <span className="material-symbols-outlined text-error">cancel</span>;
                  } else if (isSelected) {
                    optionClass = 'bg-primary-container/25 border-primary/65';
                  }

                  return (
                    <button
                      key={answer.letter}
                      type="button"
                      onClick={() => handleSelect(question.displayId, answer.letter, question)}
                      className={`w-full min-h-[4.75rem] p-4 rounded-xl flex items-center gap-4 border text-left transition-all ${optionClass}`}
                    >
                      <span
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                          hasAnswered && isCorrect
                            ? 'bg-success text-white'
                            : hasAnswered && isSelected && !isCorrect
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
          );
        })}
      </section>
    </div>
  );
}
