'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import Stats from '@/components/Stats';
import Header from '@/components/Header';
import SignUpForm from '@/components/SignUpForm';
import LoginForm from '@/components/LoginForm';
import { useHybridStickers } from '@/hooks/useHybridStickers';
import { useHybridAuth } from '@/hooks/useHybridAuth';
import { useHybridStickerLabels } from '@/hooks/useHybridStickerLabels';
import { SignUpData } from '@/types/auth';

type ViewMode = 'calendar' | 'signup' | 'login';

export default function Home() {
  const { authState, signUp, login, logout } = useHybridAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // 年月状態管理
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const userId = authState.user?.id;
  const { getDayStickers, toggleSticker, getStats } = useHybridStickers(userId, selectedYear, selectedMonth);
  const { labels } = useHybridStickerLabels(userId, authState.isAuthenticated);
  const stats = getStats();

  // 月変更ハンドラー
  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleSignUp = async (data: SignUpData) => {
    const result = await signUp(data);
    if (result.success) {
      setViewMode('calendar');
    }
    return result;
  };

  const handleLogin = async (data: { email: string; password: string }) => {
    const result = await login(data);
    if (result.success) {
      setViewMode('calendar');
    }
    return result;
  };

  const handleLogout = () => {
    logout();
    setViewMode('calendar');
  };

  // 認証画面の表示
  if (viewMode === 'signup') {
    return (
      <SignUpForm 
        onSignUp={handleSignUp}
        onSwitchToLogin={() => setViewMode('login')}
      />
    );
  }

  if (viewMode === 'login') {
    return (
      <LoginForm 
        onLogin={handleLogin}
        onSwitchToSignUp={() => setViewMode('signup')}
      />
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        <Header 
          user={authState.isAuthenticated && authState.user ? authState.user : undefined}
          onLogout={handleLogout}
          onShowSignUp={() => setViewMode('signup')}
          onShowLogin={() => setViewMode('login')}
        />

        <div className="space-y-3 sm:space-y-6">
          <Calendar
            onStickerClick={toggleSticker}
            getDayStickers={getDayStickers}
            userId={userId}
            year={selectedYear}
            month={selectedMonth}
            onMonthChange={handleMonthChange}
            isSupabaseAuth={authState.isAuthenticated}
            stickerLabels={labels}
          />
          
          <Stats 
            totalStickers={stats.totalStickers}
            daysWithStickers={stats.daysWithStickers}
            daysInMonth={stats.daysInMonth}
            percentage={stats.percentage}
            year={stats.year}
            month={stats.month}
          />
        </div>
      </div>
    </main>
  );
}
