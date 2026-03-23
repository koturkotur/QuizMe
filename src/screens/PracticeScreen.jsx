import React, { useMemo, useState } from 'react';
import TopBar from '../components/TopBar';
import { questionsData } from '../data/questions';
import { preparePracticeQuestions } from '../utils/parser';

export default function PracticeScreen() {
  const [answers, setAnswers] = useState({});

  const practiceQuestions = useMemo(() => preparePracticeQuestions(questionsData), []);

  const handleSelect = (questionId, letter) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: letter
    }));
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="app-page-wide">
      <TopBar title="Vežbaj" showBack />

      <section className="mb-6 mt-5 app-card p-5">
        <h2 className="font-headline text-2xl font-extrabold text-on-surface">Vežbanje - svih 170 pitanja</h2>
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
                      onClick={() => handleSelect(question.displayId, answer.letter)}
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
