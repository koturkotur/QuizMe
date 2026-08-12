import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { getTestHistory, getHistoryStats, formatDate } from '../utils/storage';
import { useApp } from '../App';

export default function HistoryScreen() {
  const navigate = useNavigate();
  const { refreshKey } = useApp();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    setHistory(getTestHistory());
    setStats(getHistoryStats());
  }, [refreshKey]);

  const getTestCountLabel = (count) => {
    const lastTwo = count % 100;
    const lastOne = count % 10;

    if (lastOne === 1 && lastTwo !== 11) {
      return 'test';
    }

    if (lastOne >= 2 && lastOne <= 4 && (lastTwo < 12 || lastTwo > 14)) {
      return 'testa';
    }

    return 'testova';
  };
  
  return (
    <div className="app-page">
      <TopBar title="Istorija" showBack />
      
      <header className="mb-8 mt-5">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface mb-2">
          Urađeni testovi
        </h2>
        <p className="text-on-surface-variant font-medium">
          Pregledaj svoju istoriju učenja i napredak.
        </p>
      </header>
      
      {stats && stats.totalTests > 0 && (
        <div className="grid grid-cols-12 gap-4 mb-8">
          <div className="col-span-7 gradient-primary text-white p-6 rounded-xl shadow-card flex flex-col justify-between h-40">
            <span className="font-headline text-sm font-bold opacity-85 uppercase tracking-[0.14em]">Ukupno rešeno</span>
            <div className="font-headline text-4xl font-extrabold">
              {stats.totalTests}{' '}
              <span className="text-xl font-semibold opacity-80">{getTestCountLabel(stats.totalTests)}</span>
            </div>
          </div>
          <div className="col-span-5 app-card-soft p-6 flex flex-col justify-between h-40">
            <span className="font-headline text-sm font-bold opacity-85 uppercase tracking-[0.14em]">Prosek</span>
            <div className="font-headline text-4xl font-extrabold">{stats.averagePercentage}%</div>
          </div>
        </div>
      )}
      
      {history.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center">
          <div className="w-24 h-24 mb-6 bg-surface-container-high rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-outline-variant text-5xl">inventory_2</span>
          </div>
          <h4 className="text-xl font-bold mb-2">Nemaš još nijedan urađen test</h4>
          <p className="text-on-surface-variant max-w-xs mb-8">
            Započni vežbanje i tvoji rezultati će se pojaviti ovde!
          </p>
          <button 
            onClick={() => navigate('/test')}
            className="gradient-primary text-white font-bold py-4 px-10 rounded-xl shadow-card active:scale-95 transition-transform"
          >
            Započni vežbanje
          </button>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {history.map((test, idx) => {
            const testNumber = history.length - idx;
            return (
            <div 
              key={test.id}
              onClick={() => navigate(`/history/${test.id}`)}
              className="group relative history-item p-5 cursor-pointer"
            >
              <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="history-icon">
                    <span className="material-symbols-outlined text-primary">history</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-on-surface-variant">{formatDate(test.date)}</p>
                    <h3 className="text-[1.05rem] font-bold">Test {testNumber}</h3>
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
                    <span className="inline-block text-[11px] font-semibold text-primary bg-primary-container/45 px-2.5 py-1 rounded-full">
                      {test.percentage}% uspešnost
                    </span>
                  </div>
                </div>
              </div>
              <div className="w-full h-2.5 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full progress-bar-fill transition-all"
                  style={{ width: `${test.percentage}%` }}
                />
              </div>
              <div className="absolute inset-y-0 right-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
