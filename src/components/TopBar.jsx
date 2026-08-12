import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TopBar({ title = "Priprema - Politehnika", showBack = false, onBack }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };
  
  return (
    <header className="w-full top-0 sticky z-50 flex items-center justify-between px-1 py-3 mb-2 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/20">
      <div className="flex items-center gap-4">
        {showBack && (
          <button 
            onClick={handleBack}
            className="hover:bg-surface-container-low rounded-full p-2 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-primary">arrow_back</span>
          </button>
        )}
        <h1 className="font-headline font-extrabold text-[1.15rem] tracking-tight text-on-surface">
          {title}
        </h1>
      </div>
      <div className="w-10 h-10 rounded-full border border-outline-variant/35 bg-surface-container-highest overflow-hidden">
        <div className="w-full h-full bg-primary-container flex items-center justify-center text-primary font-bold">
          P
        </div>
      </div>
    </header>
  );
}
