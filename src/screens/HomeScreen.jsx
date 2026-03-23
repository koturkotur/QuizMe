import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { getTestHistory, getHistoryStats, formatDate } from '../utils/storage';
import { useApp } from '../App';

export default function HomeScreen() {
  const navigate = useNavigate();
  const { refreshKey } = useApp();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    setHistory(getTestHistory().slice(0, 3));
    setStats(getHistoryStats());
  }, [refreshKey]);
  
  return (
    <div
      className="app-page"
      style={{ paddingBottom: 'max(3.4rem, calc(1.9rem + env(safe-area-inset-bottom)))' }}
    >
      <TopBar />
      
      <section className="mb-8 mt-5">
        <div className="gradient-hero rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="font-headline font-extrabold text-3xl mb-2 tracking-tight">
              Priprema za prijemni
            </h2>
            <p className="text-white/90 text-lg max-w-[280px]">
              Vežbaj pitanja i simuliraj prijemni ispit
            </p>
          </div>
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
        </div>
      </section>
      
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button 
          onClick={() => navigate('/questions')}
          className="flex items-center justify-between p-6 app-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">menu_book</span>
            </div>
            <span className="font-headline font-bold text-lg">Sva pitanja</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </button>
        
        <button 
          onClick={() => navigate('/test')}
          className="flex items-center justify-between p-6 gradient-primary rounded-xl shadow-card hover:brightness-105 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </div>
            <span className="font-headline font-bold text-lg text-white">Započni test</span>
          </div>
          <span className="material-symbols-outlined text-white/70">chevron_right</span>
        </button>

        <button
          onClick={() => navigate('/practice')}
          className="md:col-span-2 flex items-center justify-between p-5 app-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-base">Vežbaj (instant povratna informacija)</p>
              <p className="text-sm text-on-surface-variant">170 pitanja, izmešani odgovori</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </button>
      </section>
      
      {stats && stats.totalTests > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="app-card-soft p-6">
              <span className="material-symbols-outlined text-secondary mb-2">trending_up</span>
              <p className="text-2xl font-extrabold text-on-secondary-container">
                {stats.averagePercentage}%
              </p>
              <p className="text-xs font-bold text-on-secondary-container opacity-70">Prosečna uspešnost</p>
            </div>
            <div className="app-card-soft p-6">
              <span className="material-symbols-outlined text-tertiary mb-2">check_circle</span>
              <p className="text-2xl font-extrabold text-on-tertiary-container">
                {stats.totalTests}
              </p>
              <p className="text-xs font-bold text-on-tertiary-container opacity-70">Urađenih testova</p>
            </div>
          </div>
        </section>
      )}
      
      <section>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-headline font-bold text-xl">Urađeni testovi</h3>
          <button 
            onClick={() => navigate('/history')}
            className="text-primary font-bold text-sm hover:underline"
          >
            Vidi sve
          </button>
        </div>
        
        {history.length === 0 ? (
          <div className="app-card p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-surface-container-low flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-outline text-3xl">history</span>
            </div>
            <p className="text-on-surface-variant">Nema još nijedan urađen test</p>
            <p className="text-sm text-outline mt-1">Započni test i tvoji rezultati će se pojaviti ovde!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((test) => (
              <div 
                key={test.id}
                onClick={() => navigate(`/history/${test.id}`)}
                className="history-item flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="history-icon">
                    <span className="material-symbols-outlined text-primary">history</span>
                  </div>
                  <div>
                    <p className="font-headline font-bold text-on-surface text-[1.05rem]">Simulacija ispita</p>
                    <p className="font-body text-sm text-on-surface-variant">{formatDate(test.date)}</p>
                  </div>
                </div>
                <div className="history-score">
                  <div className="history-score-stack">
                    <div className="history-score-panel">
                      <p className="history-score-label">Poena</p>
                      <p className="history-score-value">
                        {test.score}
                        <span className="history-score-total">/{test.maxScore}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
