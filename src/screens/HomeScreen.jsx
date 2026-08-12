import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/TopBar';
import { getTestHistory, getHistoryStats, formatDate } from '../utils/storage';
import { getChallenge, countMastered, getWrongSummary } from '../utils/questionStats';
import { getRecordBest } from '../utils/recordStorage';
import { useApp } from '../App';

const TOTAL_LEVELS = 10;
const TOTAL_QUESTIONS = 170;

function getPercentageColor(pct) {
  // 0% = red, 50% = orange, 100% = green
  const r = Math.round(pct <= 50 ? 200 : 200 - ((pct - 50) * 4));
  const g = Math.round(pct <= 50 ? pct * 4 : 200);
  return `rgb(${r}, ${g}, 40)`;
}

function LevelDots({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const level = i + 1;
        const isCurrent = level === current;
        const isDone = level < current;
        return (
          <span
            key={level}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              isCurrent ? 'bg-primary w-6' : isDone ? 'bg-primary/70' : 'bg-white/40'
            }`}
          />
        );
      })}
    </div>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { refreshKey } = useApp();
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [challenge, setChallenge] = useState(null);
  const [mastered, setMastered] = useState(0);
  const [wrongSummary, setWrongSummary] = useState(null);
  const [recordBest, setRecordBest] = useState(null);

  useEffect(() => {
    setHistory(getTestHistory().slice(0, 3));
    setStats(getHistoryStats());
    setChallenge(getChallenge());
    setMastered(countMastered());
    setWrongSummary(getWrongSummary());
    setRecordBest(getRecordBest());
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
      
      <section className="space-y-4 mb-8">
        {/* Započni test */}
        <button
          onClick={() => navigate('/test')}
          className="w-full flex items-center justify-between p-5 gradient-primary rounded-xl shadow-card hover:brightness-105 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-lg text-white">Započni test</p>
              <p className="text-sm text-white/80">30 nasumičnih pitanja — simulacija prijemnog</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-white/70">chevron_right</span>
        </button>

        {/* Igraj za rekord */}
        <button
          onClick={() => navigate('/record')}
          className="w-full flex items-center justify-between p-5 app-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-error/15 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl">whatshot</span>
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-lg">Igraj za rekord</p>
              <p className="text-sm text-on-surface-variant">Koliko pitanja možeš da rešiš tačno zaredom?</p>
              <p className="text-xs font-semibold text-error mt-0.5">
                Lični rekord: {recordBest == null ? '—' : `${recordBest}${recordBest >= 170 ? ' / 170' : ''}`}
              </p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </button>

        {/* Savladaj sva pitanja */}
        {challenge && (
          <button
            onClick={() => navigate('/challenge')}
            className="w-full app-card p-6 text-left hover:shadow-card-hover transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-3xl">emoji_events</span>
                </div>
                <div>
                  <p className="font-headline font-bold text-lg">Savladaj sva pitanja</p>
                  <p className="text-sm text-on-surface-variant">10 nivoa — glavni režim napredovanja</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
            </div>

            <div className="flex items-center justify-between mb-2">
              <span className="font-headline font-bold text-on-surface">Nivo {challenge.level} od {TOTAL_LEVELS}</span>
              <span className="text-sm font-semibold text-on-surface-variant">{mastered} / {TOTAL_QUESTIONS} pitanja</span>
            </div>
            <div className="h-3 w-full bg-surface-container-highest rounded-full overflow-hidden p-1">
              <div
                className="h-full progress-bar-fill rounded-full transition-all"
                style={{ width: `${(mastered / TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>
            <div className="mt-3">
              <LevelDots current={challenge.level} total={TOTAL_LEVELS} />
            </div>

            <div className="mt-4">
              <span className="inline-block text-sm font-semibold text-primary bg-primary-container/45 px-3 py-1.5 rounded-full">
                {mastered > 0 ? 'Nastavi' : 'Započni izazov'}
              </span>
            </div>
          </button>
        )}

        {/* Vežbaj pogrešena pitanja */}
        <button
          onClick={() => navigate('/wrong')}
          className="w-full flex items-center justify-between p-5 app-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-error/15 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">target</span>
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-base">Vežbaj pogrešena pitanja</p>
              <p className="text-sm text-on-surface-variant">Fokusiraj se na pitanja koja ti najteže idu</p>
              {wrongSummary && wrongSummary.totalMastered > 0 && (
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {wrongSummary.totalMastered} ukupno savladana
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {wrongSummary && wrongSummary.activeCount > 0 && (
              <span className="text-xs font-bold text-error bg-error/10 px-2.5 py-1 rounded-full">
                {wrongSummary.activeCount} za vežbanje
              </span>
            )}
            <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
          </div>
        </button>

        {/* Vežbaj sva pitanja */}
        <button
          onClick={() => navigate('/practice')}
          className="w-full flex items-center justify-between p-5 app-card hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/15 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined">menu_book</span>
            </div>
            <div className="text-left">
              <p className="font-headline font-bold text-base">Vežbaj sva pitanja</p>
              <p className="text-sm text-on-surface-variant">Pregledaj i vežbaj svih 170 pitanja svojim tempom</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </button>
      </section>

      {/* Stari "Sva pitanja" link zadržan kao manja akcija */}
      <section className="mb-8">
        <button
          onClick={() => navigate('/questions')}
          className="w-full flex items-center justify-between p-4 app-card-soft hover:shadow-card-hover transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-xl">list_alt</span>
            </div>
            <span className="font-headline font-semibold text-base">Pregled svih pitanja (sa rešenjima)</span>
          </div>
          <span className="material-symbols-outlined text-outline-variant">chevron_right</span>
        </button>
      </section>
      
      {stats && stats.totalTests > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="app-card-soft p-6">
              <span className="material-symbols-outlined mb-2" style={{ color: getPercentageColor(stats.averagePercentage) }}>trending_up</span>
              <p className="text-2xl font-extrabold" style={{ color: getPercentageColor(stats.averagePercentage) }}>
                {stats.averagePercentage}%
              </p>
              <p className="text-xs font-bold opacity-70" style={{ color: getPercentageColor(stats.averagePercentage) }}>Prosečna uspešnost</p>
            </div>
            <div className="app-card-soft p-6">
              <span className="material-symbols-outlined text-success mb-2">check_circle</span>
              <p className="text-2xl font-extrabold text-success">
                {stats.totalTests}
              </p>
              <p className="text-xs font-bold text-success opacity-70">Urađenih testova</p>
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
            {history.map((test, idx) => {
              const testNumber = getTestHistory().length - idx;
              return (
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
                    <p className="font-headline font-bold text-on-surface text-[1.05rem]">Test {testNumber}</p>
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
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
