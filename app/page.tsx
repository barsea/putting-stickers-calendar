'use client';

import { useState } from 'react';
import Calendar from '@/components/Calendar';
import Stats from '@/components/Stats';
import UserInfo from '@/components/UserInfo';
import AuthButtons from '@/components/AuthButtons';
import SignUpForm from '@/components/SignUpForm';
import LoginForm from '@/components/LoginForm';
import { useStickers } from '@/hooks/useStickers';
import { useAuth } from '@/hooks/useAuth';

type ViewMode = 'calendar' | 'signup' | 'login';

export default function Home() {
  const { authState, signUp, login, logout } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  
  // 年月状態管理
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  
  const userId = authState.user?.id;
  const { getDayStickers, toggleSticker, getStats } = useStickers(userId, selectedYear, selectedMonth);
  const stats = getStats();

  // 月変更ハンドラー
  const handleMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
  };

  const handleSignUp = async (data: { email: string; password: string; displayName: string }) => {
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
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ステッカーカレンダー
          </h1>
          <p className="text-gray-600">
            習慣化をサポートする、シンプルなカレンダーアプリ
          </p>
        </header>

        <div className="space-y-6">
          {/* 認証状態に応じた表示 */}
          {authState.isAuthenticated && authState.user ? (
            <UserInfo user={authState.user} onLogout={handleLogout} />
          ) : (
            <AuthButtons 
              onShowSignUp={() => setViewMode('signup')}
              onShowLogin={() => setViewMode('login')}
            />
          )}

          <Calendar 
            onStickerClick={toggleSticker}
            getDayStickers={getDayStickers}
            userId={userId}
            year={selectedYear}
            month={selectedMonth}
            onMonthChange={handleMonthChange}
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
