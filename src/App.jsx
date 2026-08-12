import React, { useState, createContext, useContext } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import HomeScreen from './screens/HomeScreen';
import AllQuestionsScreen from './screens/AllQuestionsScreen';
import PracticeScreen from './screens/PracticeScreen';
import WrongQuestionsScreen from './screens/WrongQuestionsScreen';
import ChallengeScreen from './screens/ChallengeScreen';
import TestScreen from './screens/TestScreen';
import ResultsScreen from './screens/ResultsScreen';
import HistoryScreen from './screens/HistoryScreen';
import TestDetailScreen from './screens/TestDetailScreen';
import BottomNav from './components/BottomNav';
import { saveTestResult } from './utils/storage';

export const AppContext = createContext();

function AppContent() {
  const [currentTest, setCurrentTest] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const isTestMode = ['/test', '/results', '/challenge', '/wrong'].includes(location.pathname);
  
  const refreshHistory = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const startNewTest = (testData) => {
    setCurrentTest(testData);
    navigate('/test');
  };
  
  const finishTest = (results) => {
    saveTestResult(results);
    setCurrentTest(results);
    refreshHistory();
    navigate('/results');
  };
  
  const goHome = () => {
    setCurrentTest(null);
    navigate('/');
  };
  
  return (
    <AppContext.Provider value={{ 
      currentTest, 
      setCurrentTest, 
      startNewTest, 
      finishTest, 
      goHome,
      refreshHistory,
      refreshKey 
    }}>
      <div className="min-h-screen bg-surface pb-24">
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/questions" element={<AllQuestionsScreen />} />
          <Route path="/practice" element={<PracticeScreen />} />
          <Route path="/wrong" element={<WrongQuestionsScreen />} />
          <Route path="/challenge" element={<ChallengeScreen />} />
          <Route path="/test" element={<TestScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/history/:id" element={<TestDetailScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!isTestMode && <BottomNav />}
    </AppContext.Provider>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export function useApp() {
  return useContext(AppContext);
}
