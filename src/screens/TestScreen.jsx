import React, { useState, useEffect, useMemo } from 'react';
import TopBar from '../components/TopBar';
import QuestionCard from '../components/QuestionCard';
import { questionsData } from '../data/questions';
import { generateRandomTest } from '../utils/parser';
import { useApp } from '../App';

export default function TestScreen() {
  const { finishTest } = useApp();
  const [testQuestions, setTestQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [testStarted, setTestStarted] = useState(false);
  
  useEffect(() => {
    if (!testStarted) {
      const test = generateRandomTest(questionsData, 30);
      setTestQuestions(test);
      setTestStarted(true);
    }
  }, [testStarted]);
  
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = testQuestions.length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  const unansweredIds = useMemo(() => {
    return testQuestions
      .filter(q => !answers[q.displayId])
      .map(q => q.displayId);
  }, [testQuestions, answers]);
  
  const handleSelectAnswer = (questionId, letter) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: letter
    }));
  };
  
  const scrollToUnanswered = () => {
    if (unansweredIds.length > 0) {
      const firstUnanswered = document.getElementById(`question-${unansweredIds[0]}`);
      if (firstUnanswered) {
        firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };
  
  const handleFinishTest = () => {
    const results = testQuestions.map(q => ({
      ...q,
      userAnswer: answers[q.displayId] || null,
      isCorrect: answers[q.displayId] === q.correctAnswer
    }));
    
    const correctCount = results.filter(r => r.isCorrect).length;
    const score = correctCount * 2;
    const maxScore = totalQuestions * 2;
    
    finishTest({
      questions: results,
      score,
      maxScore,
      correctCount,
      totalQuestions,
      percentage: Math.round((correctCount / totalQuestions) * 100)
    });
  };
  
  if (testQuestions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  return (
    <div className="app-page">
      <TopBar title="Test" showBack />
      
      <div className="sticky top-[64px] z-40 bg-surface pt-3 pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 mb-4 border-b border-outline-variant/20">
        <div className="flex justify-between items-end mb-2">
          <span className="font-headline font-extrabold text-on-surface">
            {answeredCount} <span className="text-on-surface-variant font-medium text-sm">od {totalQuestions}</span>
          </span>
          {unansweredIds.length > 0 && (
            <button 
              onClick={scrollToUnanswered}
              className="text-error text-sm font-semibold hover:underline"
            >
              {unansweredIds.length} neodgovorenih
            </button>
          )}
        </div>
        <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-1">
          <div 
            className="h-full progress-bar-fill rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      
      <div className="space-y-5 pb-40">
        {testQuestions.map((question) => (
          <div key={question.displayId} id={`question-${question.displayId}`}>
            <QuestionCard 
              question={question}
              selectedLetter={answers[question.displayId] || null}
              onSelect={(letter) => handleSelectAnswer(question.displayId, letter)}
            />
          </div>
        ))}
      </div>
      
      <div className="app-fixed-bar">
        <div
          className="app-fixed-inner"
          style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        >
          <button
            onClick={handleFinishTest}
            className="w-full gradient-primary text-white font-headline font-bold text-lg py-4 px-8 rounded-xl shadow-card active:scale-95 transition-transform flex items-center justify-center gap-3"
          >
            Završi test
            <span className="material-symbols-outlined">check</span>
          </button>
        </div>
      </div>
    </div>
  );
}
