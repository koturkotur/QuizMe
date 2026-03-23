import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="app-fixed-bar z-50 rounded-t-[1.4rem]">
      <div
        className="max-w-2xl mx-auto w-full flex items-center gap-3 px-4 pb-5 pt-3"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
      <button 
        onClick={() => navigate('/')}
        className={`flex-1 flex flex-col items-center justify-center px-4 py-2.5 rounded-xl transition-all active:scale-90 ${
          isActive('/') 
            ? 'bg-[#3867f5] text-white shadow-[0_8px_20px_rgba(56,103,245,0.28)]' 
            : 'text-on-surface-variant opacity-60 hover:opacity-100'
        }`}
      >
        <span className={`material-symbols-outlined ${isActive('/') ? 'material-symbols-filled' : ''}`}>
          home
        </span>
        <span className="font-body text-[12px] font-semibold mt-1">Početna</span>
      </button>
      
      <button 
        onClick={() => navigate('/questions')}
        className={`flex-1 flex flex-col items-center justify-center px-4 py-2.5 rounded-xl transition-all active:scale-90 ${
          isActive('/questions') 
            ? 'bg-[#3867f5] text-white shadow-[0_8px_20px_rgba(56,103,245,0.28)]' 
            : 'text-on-surface-variant opacity-60 hover:opacity-100'
        }`}
      >
        <span className={`material-symbols-outlined ${isActive('/questions') ? 'material-symbols-filled' : ''}`}>
          quiz
        </span>
        <span className="font-body text-[12px] font-semibold mt-1">Pitanja</span>
      </button>
      
      <button 
        onClick={() => navigate('/history')}
        className={`flex-1 flex flex-col items-center justify-center px-4 py-2.5 rounded-xl transition-all active:scale-90 ${
          isActive('/history') || location.pathname.startsWith('/history/')
            ? 'bg-[#3867f5] text-white shadow-[0_8px_20px_rgba(56,103,245,0.28)]' 
            : 'text-on-surface-variant opacity-60 hover:opacity-100'
        }`}
      >
        <span className={`material-symbols-outlined ${
          isActive('/history') || location.pathname.startsWith('/history/') 
            ? 'material-symbols-filled' 
            : ''
        }`}>
          history
        </span>
        <span className="font-body text-[12px] font-semibold mt-1">Istorija</span>
      </button>
      </div>
    </nav>
  );
}
