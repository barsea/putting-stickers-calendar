'use client';

import { useState } from 'react';

interface CalendarProps {
  onDateClick: (date: number) => void;
  stickerDates: Set<number>;
}

export default function Calendar({ onDateClick, stickerDates }: CalendarProps) {
  const [currentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 月の最初の日と最後の日を取得
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  // 月の最初の日が何曜日かを取得（日曜日を0とする）
  const startDayOfWeek = firstDay.getDay();
  
  // 曜日のラベル
  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 月名の配列
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];
  
  // カレンダーのグリッドを作成
  const createCalendarGrid = () => {
    const grid = [];
    
    // 空白セルを最初に追加（月の最初の日より前）
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push(null);
    }
    
    // 日付セルを追加
    for (let date = 1; date <= daysInMonth; date++) {
      grid.push(date);
    }
    
    return grid;
  };
  
  const calendarGrid = createCalendarGrid();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* カレンダーヘッダー */}
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">
          {year}年 {monthNames[month]}
        </h2>
      </div>
      
      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-sm font-medium text-gray-600 py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1">
        {calendarGrid.map((date, index) => (
          <div
            key={index}
            className="aspect-square flex items-center justify-center relative"
          >
            {date && (
              <button
                onClick={() => onDateClick(date)}
                className={`w-full h-full rounded-lg flex items-center justify-center text-sm font-medium transition-colors relative
                  ${stickerDates.has(date) 
                    ? 'bg-yellow-100 text-gray-800 hover:bg-yellow-200' 
                    : 'hover:bg-gray-100 text-gray-700'}
                `}
              >
                {date}
                {stickerDates.has(date) && (
                  <div className="absolute top-0 right-0 w-3 h-3">
                    <div className="w-full h-full bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-xs">⭐</span>
                    </div>
                  </div>
                )}
              </button>
            )}
          </div>
        ))}
      </div>
      
      {/* 説明テキスト */}
      <div className="mt-4 text-center text-sm text-gray-500">
        日付をタップしてステッカーを貼ろう！
      </div>
    </div>
  );
}