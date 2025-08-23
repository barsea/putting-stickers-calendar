'use client';

import Calendar from '@/components/Calendar';
import Stats from '@/components/Stats';
import { useStickers } from '@/hooks/useStickers';

export default function Home() {
  const { getDayStickers, toggleSticker, getStats } = useStickers();
  const stats = getStats();

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
          <Calendar 
            onStickerClick={toggleSticker}
            getDayStickers={getDayStickers}
          />
          
          <Stats 
            totalStickers={stats.totalStickers}
            daysWithStickers={stats.daysWithStickers}
            daysInMonth={stats.daysInMonth}
            percentage={stats.percentage}
          />
        </div>
      </div>
    </main>
  );
}
