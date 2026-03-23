import React, { useState, useMemo } from 'react';
import TopBar from '../components/TopBar';
import QuestionCard from '../components/QuestionCard';
import { questionsData } from '../data/questions';

export default function AllQuestionsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAnswers, setShowAnswers] = useState(true);
  
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return questionsData;
    
    const query = searchQuery.toLowerCase();
    return questionsData.filter(q => 
      q.text.toLowerCase().includes(query) ||
      q.answers.some(a => a.text.toLowerCase().includes(query))
    );
  }, [searchQuery]);
  
  return (
    <div className="app-page-wide">
      <TopBar title="Sva pitanja" showBack />
      
      <div className="mb-8 space-y-5 mt-5">
        <h2 className="font-headline font-extrabold text-3xl tracking-tight text-on-surface">
          Sva pitanja
        </h2>
        
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-primary font-semibold">search</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pretraži pitanja..."
            className="app-input pl-12 pr-4"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-on-surface-variant">
            {filteredQuestions.length} pitanja
          </p>
          <button 
            onClick={() => setShowAnswers(!showAnswers)}
            className="text-primary font-semibold text-sm hover:underline"
          >
            {showAnswers ? 'Sakrij odgovore' : 'Prikaži odgovore'}
          </button>
        </div>
      </div>
      
      <div className="space-y-5 pb-8">
        {filteredQuestions.map((question, index) => (
          <QuestionCard 
            key={question.id} 
            question={{...question, displayId: index + 1}} 
            showCorrect={showAnswers}
          />
        ))}
      </div>
      
      {filteredQuestions.length === 0 && (
        <div className="text-center py-12">
          <span className="material-symbols-outlined text-outline text-5xl mb-4">search_off</span>
          <p className="text-on-surface-variant">Nema pitanja koja odgovaraju pretrazi</p>
        </div>
      )}
    </div>
  );
}
