import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import Button from '../components/Button';
import { useApp } from '../App';

export default function ResultsScreen() {
  const navigate = useNavigate();
  const { currentTest, goHome } = useApp();
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentTest]);
  
  if (!currentTest) {
    return (
      <div className="app-page">
        <TopBar title="Rezultat" showBack />
        <div className="text-center py-12">
          <p className="text-on-surface-variant">Nema rezultata za prikaz</p>
          <Button onClick={goHome} className="mt-4">Nazad na početnu</Button>
        </div>
      </div>
    );
  }
  
  const { score, maxScore, correctCount, totalQuestions, percentage, questions } = currentTest;
  
  const getMessage = () => {
    if (percentage >= 90) return { text: "Svaka čast!", subtext: "Odličan rezultat!" };
    if (percentage >= 75) return { text: "Veoma dobro!", subtext: "Spremni ste za Politehniku." };
    if (percentage >= 60) return { text: "Dobro!", subtext: "Nastavite sa vežbanjem." };
    return { text: "Nastavi sa vežbanjem", subtext: "Verujem u tebe!" };
  };
  
  const message = getMessage();
  const findAnswerText = (question, letter) => {
    if (!letter) return 'Nije odgovoreno';
    const match = question.answers.find((answer) => answer.letter === letter);
    return match ? `${letter}. ${match.text}` : letter;
  };

  const getQuestionStatus = (question) => {
    if (!question.userAnswer) {
      return { label: 'Preskoceno', className: 'bg-outline-variant/30 text-on-surface-variant' };
    }

    if (question.isCorrect) {
      return { label: 'Tacno', className: 'bg-success/10 text-success' };
    }

    return { label: 'Netacno', className: 'bg-error/10 text-error' };
  };
  
  const handleRepeatTest = () => {
    navigate('/test');
  };
  
  return (
    <div className="app-page">
      <TopBar title="Rezultat" showBack={false} />
      
      <section className="app-card p-8 text-center mb-6 animate-scale-in">
        <span className="text-on-surface-variant font-semibold text-sm tracking-wide uppercase">
          Vaš učinak
        </span>
        <div className="flex flex-col items-center mt-4">
          <div className="text-6xl font-headline font-extrabold text-primary">
            {score}<span className="text-3xl text-outline font-medium">/{maxScore}</span>
          </div>
          <div className="mt-4 px-6 py-2 bg-primary-container text-primary rounded-full text-sm font-bold">
            {message.text}
          </div>
        </div>
        <div className="pt-4 mt-4 border-t border-outline-variant/30">
          <h3 className="font-headline font-bold text-lg text-on-surface">{message.subtext}</h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {correctCount} tačnih odgovora od {totalQuestions} pitanja
          </p>
        </div>
      </section>
      
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="app-card p-6 border-success/20 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-success text-3xl">check_circle</span>
          <div className="text-2xl font-headline font-bold text-success">{correctCount}</div>
          <span className="text-xs font-medium text-on-surface-variant">Tačna odgovora</span>
        </div>
        <div className="app-card p-6 border-error/20 flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-error text-3xl">cancel</span>
          <div className="text-2xl font-headline font-bold text-error">{totalQuestions - correctCount}</div>
          <span className="text-xs font-medium text-on-surface-variant">Netačna odgovora</span>
        </div>
      </section>
      
      <section className="space-y-4 mb-8 pb-40">
        <h2 className="font-headline font-bold text-xl px-2">Kompletan pregled odgovora</h2>

        {questions.map((q) => {
          const status = getQuestionStatus(q);
          const showCorrectBlock = !q.isCorrect;

          return (
            <article
              key={q.displayId}
              className={`app-card p-6 ${
                q.isCorrect ? 'border-success/20' : q.userAnswer ? 'border-error/20' : 'border-outline-variant/40'
              }`}
            >
            <div className="flex items-center justify-between mb-3">
              <span className="bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wide">
                Pitanje {q.displayId}
              </span>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
                {status.label}
              </span>
            </div>

            <h3 className="font-headline font-bold text-base text-on-surface leading-relaxed mb-4">{q.text}</h3>

            <div className="space-y-2">
              <div
                className={`rounded-xl p-3 border ${
                  q.isCorrect
                    ? 'bg-success/5 border-success/20'
                    : q.userAnswer
                      ? 'bg-error/5 border-error/20'
                      : 'bg-surface-container-low border-outline-variant/40'
                }`}
              >
                <p
                  className={`text-xs font-semibold mb-1 ${
                    q.isCorrect ? 'text-success' : q.userAnswer ? 'text-error' : 'text-on-surface-variant'
                  }`}
                >
                  Tvoj odgovor
                </p>
                <p className="text-sm text-on-surface">{findAnswerText(q, q.userAnswer)}</p>
              </div>

              {showCorrectBlock && (
                <div className="rounded-xl bg-success/5 border border-success/20 p-3">
                  <p className="text-xs font-semibold text-success mb-1">Tacan odgovor</p>
                  <p className="text-sm text-on-surface">{findAnswerText(q, q.correctAnswer)}</p>
                </div>
              )}
            </div>
          </article>
          );
        })}
      </section>
      
      <div className="app-fixed-bar z-50">
        <section
          className="app-fixed-inner flex flex-col gap-3"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <Button onClick={handleRepeatTest} className="w-full">
            Ponovi test
          </Button>
          <Button onClick={goHome} variant="ghost" className="w-full">
            Nazad na početnu
          </Button>
        </section>
      </div>
    </div>
  );
}
