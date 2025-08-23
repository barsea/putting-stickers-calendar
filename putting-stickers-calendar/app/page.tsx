'use client';

import Calendar from '@/components/Calendar';
import Stats from '@/components/Stats';
import { useStickers } from '@/hooks/useStickers';

export default function Home() {
  const { stickerDates, toggleSticker, getStats } = useStickers();
  const stats = getStats();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ステッカーカレンダー
          </h1>
          <p className="text-gray-600 text-sm">
            習慣化をサポートする、シンプルなカレンダーアプリ
          </p>
        </header>

        <Calendar 
          onDateClick={toggleSticker}
          stickerDates={stickerDates}
        />
        
        <Stats 
          totalStickers={stats.totalStickers}
          daysInMonth={stats.daysInMonth}
          percentage={stats.percentage}
        />
      </div>
    </main>
  );
}
