import React from 'react';

export default function QuestionCard({ 
  question, 
  showCorrect = false, 
  isResult = false,
  userAnswer = null,
  onSelect = null,
  selectedLetter = null
}) {
  const getAnswerClass = (answer) => {
    const baseClass = "w-full min-h-[5rem] p-4 md:p-5 rounded-xl flex items-center gap-4 transition-all border";
    const isSelected = selectedLetter === answer.letter;
    
    if (showCorrect && answer.letter === question.correctAnswer) {
      return `${baseClass} bg-success/10 border-success/50`;
    }
    
    if (isResult && userAnswer === answer.letter && answer.letter !== question.correctAnswer) {
      return `${baseClass} bg-error/10 border-error/60`;
    }
    
    if (isSelected) {
      return `${baseClass} bg-primary-container/25 border-primary/65 shadow-sm`;
    }
    
    return `${baseClass} bg-surface-container-lowest border-outline-variant/25 hover:bg-surface-container-low`;
  };
  
  return (
    <article className="app-card p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-wider">
          Pitanje {question.displayId || question.id}
        </span>
        {isResult && (
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
            userAnswer === question.correctAnswer 
              ? 'bg-success/10 text-success' 
              : 'bg-error/10 text-error'
          }`}>
            {userAnswer === question.correctAnswer ? 'Tačno' : 'Netačno'}
          </span>
        )}
      </div>
      
      <h3 className="font-headline font-bold text-lg text-on-surface mb-6 leading-relaxed">
        {question.text}
      </h3>
      
      <div className="grid gap-3">
        {question.answers.map((answer, index) => (
          <div
            key={answer.letter}
            className={getAnswerClass(answer)}
            onClick={() => onSelect && onSelect(answer.letter)}
            style={{ cursor: onSelect ? 'pointer' : 'default' }}
          >
            <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
              selectedLetter === answer.letter
                ? 'bg-primary text-white' 
                : showCorrect && answer.letter === question.correctAnswer
                  ? 'bg-success text-white'
                  : 'bg-surface-container-high text-on-surface-variant'
            }`}>
              {answer.letter}
            </span>
            <span className={`flex-1 font-body font-medium ${
              selectedLetter === answer.letter
                ? 'text-on-surface' 
                : showCorrect && answer.letter === question.correctAnswer
                  ? 'text-success'
                  : 'text-on-surface'
            }`}>
              {answer.text}
            </span>
            {showCorrect && answer.letter === question.correctAnswer && (
              <span className="material-symbols-outlined text-success">check_circle</span>
            )}
            {isResult && userAnswer === answer.letter && answer.letter !== question.correctAnswer && (
              <span className="material-symbols-outlined text-error">cancel</span>
            )}
            {isResult && userAnswer === answer.letter && answer.letter === question.correctAnswer && (
              <span className="material-symbols-outlined text-success">check_circle</span>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}
