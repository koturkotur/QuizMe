import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import QuestionCard from '../components/QuestionCard';
import Button from '../components/Button';
import { getTestById, formatDateTime } from '../utils/storage';

export default function TestDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = getTestById(id);
  
  if (!test) {
    return (
      <div className="app-page">
        <TopBar title="Detalji" showBack />
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-outline text-5xl mb-4">error</span>
          <p className="text-on-surface-variant">Test nije pronađen</p>
          <Button onClick={() => navigate('/history')} className="mt-4">
            Nazad na istoriju
          </Button>
        </div>
      </div>
    );
  }
  
  const { score, maxScore, correctCount, totalQuestions, percentage, date, questions } = test;
  
  return (
    <div className="app-page">
      <TopBar title="Detalji testa" showBack />
      
      <section className="app-card p-8 text-center mb-6 mt-4">
        <span className="text-on-surface-variant font-semibold text-sm">
          {formatDateTime(date)}
        </span>
        <div className="flex flex-col items-center mt-4">
          <div className="text-5xl font-headline font-extrabold text-primary">
            {score}<span className="text-2xl text-outline font-medium">/{maxScore}</span>
          </div>
          <div className="mt-3 px-5 py-1.5 bg-primary-container text-primary rounded-full text-sm font-bold">
            {percentage}% uspešnost
          </div>
        </div>
      </section>
      
      <section className="grid grid-cols-2 gap-4 mb-8">
        <div className="app-card p-5 border-success/20 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <div className="text-xl font-bold text-success">{correctCount}</div>
          <span className="text-xs text-on-surface-variant">Tačnih</span>
        </div>
        <div className="app-card p-5 border-error/20 flex flex-col items-center gap-1">
          <span className="material-symbols-outlined text-error">cancel</span>
          <div className="text-xl font-bold text-error">{totalQuestions - correctCount}</div>
          <span className="text-xs text-on-surface-variant">Netačnih</span>
        </div>
      </section>
      
      <section className="space-y-6 pb-8">
        <h2 className="font-headline font-bold text-xl">Sva pitanja</h2>
        {questions.map((q) => (
          <QuestionCard 
            key={q.id}
            question={q}
            isResult
            userAnswer={q.userAnswer}
          />
        ))}
      </section>
      
      <section className="pb-8">
        <Button onClick={() => navigate('/test')} className="w-full">
          Ponovi test
        </Button>
      </section>
    </div>
  );
}
