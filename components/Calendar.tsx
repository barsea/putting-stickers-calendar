'use client';
import { StickerType, DayStickers } from '@/hooks/useStickers';
import StickerLabels from './StickerLabels';
import { useState } from 'react';

interface CalendarProps {
  onStickerClick: (date: number, stickerType: StickerType) => void;
  getDayStickers: (date: number) => DayStickers;
  userId?: string;
  year: number;
  month: number;
  onMonthChange: (year: number, month: number) => void;
  isSupabaseAuth?: boolean;
  stickerLabels?: { red: string; blue: string; green: string; yellow: string };
}

export default function Calendar({ onStickerClick, getDayStickers, userId, year, month, onMonthChange, isSupabaseAuth = false, stickerLabels }: CalendarProps) {
  // アニメーション状態を管理
  const [animatingStickers, setAnimatingStickers] = useState<{[key: string]: string}>({});
  
  // ステッカークリック時のアニメーション付きハンドラー
  const handleStickerClick = (date: number, stickerType: StickerType) => {
    const key = `${date}-${stickerType}`;
    const currentStickers = getDayStickers(date);
    const isCurrentlyPlaced = currentStickers[stickerType];
    
    // アニメーションクラスを設定
    const animationClass = isCurrentlyPlaced ? 'sticker-peeling' : 'sticker-placing';
    setAnimatingStickers(prev => ({
      ...prev,
      [key]: animationClass
    }));
    
    // アニメーション完了後にクラスをクリア
    setTimeout(() => {
      setAnimatingStickers(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    }, isCurrentlyPlaced ? 600 : 800); // peelingは600ms、placingは800ms
    
    // 元のクリック処理を実行
    onStickerClick(date, stickerType);
  };

  // 前月・次月に移動する関数
  const goToPrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const goToNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  // 現在月に戻る関数
  const goToCurrentMonth = () => {
    const now = new Date();
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  // 月は1から始まるので、Dateオブジェクトで使用する際は-1する
  const displayMonth = month - 1;
  
  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, displayMonth, 1);
  const lastDay = new Date(year, displayMonth + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // 月の最初の日が何曜日かを取得（日曜日を0とする）
  const startDayOfWeek = firstDay.getDay();
  
  // 曜日のラベル
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // 英語月名の配列
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // 現在月かどうかをチェック
  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  
  // 和暦を計算（令和は2019年から）
  const getJapaneseEra = (year: number) => {
    const rewaYear = year - 2018; // 令和元年は2019年
    return `令和${rewaYear}年`;
  };
  
  // カレンダーのグリッドを作成（前月・翌月の日付も含む）
  const createCalendarGrid = () => {
    const grid = [];
    
    // 前月の最後の日を取得
    const prevMonth = new Date(year, displayMonth - 1, 0);
    const prevMonthLastDate = prevMonth.getDate();
    
    // 前月の日付を追加
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      grid.push({ 
        date: prevMonthLastDate - i, 
        isCurrentMonth: false,
        isPrevMonth: true
      });
    }
    
    // 当月の日付を追加
    for (let date = 1; date <= daysInMonth; date++) {
      grid.push({ 
        date, 
        isCurrentMonth: true,
        isPrevMonth: false
      });
    }
    
    // 翌月の日付を追加（6週間の表示になるよう調整）
    const totalCells = Math.ceil((startDayOfWeek + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (startDayOfWeek + daysInMonth);
    for (let date = 1; date <= remainingCells; date++) {
      grid.push({ 
        date, 
        isCurrentMonth: false,
        isPrevMonth: false
      });
    }
    
    return grid;
  };
  
  const calendarGrid = createCalendarGrid();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* 月移動コントロール */}
      <div className="bg-gray-50 border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevMonth}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            aria-label="前月に移動"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            前月
          </button>
          
          <div className="flex items-center space-x-2">
            {!isCurrentMonth && (
              <button
                onClick={goToCurrentMonth}
                className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                aria-label="今月に戻る"
              >
                今月へ
              </button>
            )}
          </div>
          
          <button
            onClick={goToNextMonth}
            className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
            aria-label="次月に移動"
          >
            次月
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* カレンダーヘッダー - 画像のような大きな表示 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
            {month}
          </h1>
          <div className="text-right">
            <div className="text-lg sm:text-xl md:text-2xl font-semibold">
              {monthNamesEn[displayMonth]}
            </div>
            <div className="text-sm sm:text-base md:text-lg">
              {year} ({getJapaneseEra(year)})
            </div>
          </div>
        </div>
      </div>
      
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 bg-gray-50 border-b">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`text-center py-2 sm:py-3 text-sm sm:text-base font-medium border-r last:border-r-0
              ${index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'}
            `}
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7">
        {calendarGrid.map((cell, index) => {
          const dayOfWeek = index % 7;
          const isCurrentMonth = cell.isCurrentMonth;
          const date = cell.date;
          
          return (
            <div
              key={index}
              className="h-16 sm:h-20 md:h-24 border-r border-b last:border-r-0 flex flex-col relative"
            >
              {isCurrentMonth ? (
                <div className={`w-full h-full p-1 sm:p-2 flex flex-col transition-colors relative hover:bg-gray-50`}>
                  <span className={`text-sm sm:text-base md:text-lg font-medium self-start
                    ${dayOfWeek === 0 ? 'text-red-600' : dayOfWeek === 6 ? 'text-blue-600' : 'text-gray-800'}
                  `}>
                    {date}
                  </span>
                  
                  {/* 4つのステッカー配置エリア */}
                  <div className="flex-1 grid grid-cols-2 gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                    {(['red', 'blue', 'green', 'yellow'] as const).map((color) => {
                      const isPlaced = getDayStickers(date)[color];
                      const animationKey = `${date}-${color}`;
                      const animationClass = animatingStickers[animationKey] || '';
                      const colorConfig = {
                        red: { bg: 'bg-red-500', hover: 'hover:bg-red-100', border: 'border-red-300', bgColor: 'rgba(239, 68, 68, 0.05)', name: '赤' },
                        blue: { bg: 'bg-blue-500', hover: 'hover:bg-blue-100', border: 'border-blue-300', bgColor: 'rgba(59, 130, 246, 0.05)', name: '青' },
                        green: { bg: 'bg-green-500', hover: 'hover:bg-green-100', border: 'border-green-300', bgColor: 'rgba(34, 197, 94, 0.05)', name: '緑' },
                        yellow: { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-100', border: 'border-yellow-300', bgColor: 'rgba(234, 179, 8, 0.05)', name: '黄' }
                      };

                      // ラベルまたはデフォルトの色名を使用
                      const labelName = stickerLabels?.[color] || colorConfig[color].name;
                      const ariaLabel = `${month}月${date}日 ${labelName}のステッカー ${isPlaced ? '貼られています' : '貼られていません'}`;

                      return (
                        <button
                          key={color}
                          onClick={() => handleStickerClick(date, color)}
                          className={`w-full h-full flex items-center justify-center ${colorConfig[color].hover} rounded transition-colors sticker-container`}
                          style={{ backgroundColor: isPlaced ? undefined : colorConfig[color].bgColor }}
                          aria-label={ariaLabel}
                          aria-pressed={isPlaced}
                        >
                          {isPlaced ? (
                            <div className={`sticker sticker-placed w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ${colorConfig[color].bg} rounded-full ${animationClass}`}></div>
                          ) : (
                            <div className={`sticker sticker-empty w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 border border-dashed ${colorConfig[color].border} rounded-full opacity-70 ${animationClass}`}></div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full p-1 sm:p-2 flex flex-col">
                  <span
                    className={`text-sm sm:text-base md:text-lg font-medium self-start
                      ${dayOfWeek === 0 ? 'text-red-500/40' : dayOfWeek === 6 ? 'text-blue-500/40' : 'text-gray-500/40'}
                    `}
                    aria-hidden="true"
                  >
                    {date}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* ステッカーラベル */}
      <StickerLabels userId={userId} isSupabaseAuth={isSupabaseAuth} />
    </div>
  );
}