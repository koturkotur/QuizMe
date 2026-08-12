import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import QuizRunner from '../components/QuizRunner';
import { questionsData } from '../data/questions';
import { buildSmartOrder } from '../utils/questionSelector';
import { getWrongQuestionIds, getPracticeStats } from '../utils/questionStats';

export default function WrongQuestionsScreen() {
  const navigate = useNavigate();

  const wrongIds = useMemo(() => new Set(getWrongQuestionIds()), []);
  const practiceStats = useMemo(() => getPracticeStats(), []);

  // Use smart order but only keep questions the user has ever answered wrong.
  const sourceQuestions = useMemo(() => {
    const ordered = buildSmartOrder(questionsData);
    return ordered.filter((q) => wrongIds.has(q.id));
  }, [wrongIds]);

  if (sourceQuestions.length === 0) {
    return (
      <div className="app-page">
        <TopBar title="Vežbaj pogrešna pitanja" showBack />
        <div className="mt-10 app-card p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-success text-3xl">task_alt</span>
          </div>
          <h3 className="font-headline font-bold text-lg text-on-surface">
            Još nema pitanja za vežbanje
          </h3>
          <p className="text-sm text-on-surface-variant mt-2 max-w-xs mx-auto">
            Pitanja na koja pogrešno odgovoriš (u testu, vežbanju ili izazovu) pojaviće se ovde.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 gradient-primary text-white font-bold py-3 px-8 rounded-xl shadow-card active:scale-95 transition-transform"
          >
            Nazad na početnu
          </button>
        </div>
      </div>
    );
  }

  return (
    <QuizRunner
      title="Vežbaj pogrešna pitanja"
      sourceQuestions={sourceQuestions}
      getProgressInfo={() => ({
        label: 'Pitanja za vežbanje',
        current: practiceStats.wrongQuestions,
        total: questionsData.length
      })}
      emptyMessage={
        <div className="app-card p-8 text-center">
          <p className="text-on-surface-variant">Nema pitanja za prikaz.</p>
        </div>
      }
      onFinish={() => navigate('/')}
    />
  );
}
