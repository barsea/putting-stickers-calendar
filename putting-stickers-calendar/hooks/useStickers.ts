'use client';

import { useState, useEffect } from 'react';

export function useStickers() {
  const [stickerDates, setStickerDates] = useState<Set<number>>(new Set());
  
  // LocalStorageキーを現在の年月で生成
  const getStorageKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 月は0から始まるので+1
    return `sticker-calendar-${year}-${month}`;
  };
  
  // LocalStorageからデータを読み込み
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const datesArray = JSON.parse(storedData) as number[];
        setStickerDates(new Set(datesArray));
      }
    } catch (error) {
      console.error('Failed to load sticker data from localStorage:', error);
    }
  }, []);
  
  // LocalStorageにデータを保存
  const saveStickerDates = (dates: Set<number>) => {
    try {
      const storageKey = getStorageKey();
      const datesArray = Array.from(dates);
      localStorage.setItem(storageKey, JSON.stringify(datesArray));
    } catch (error) {
      console.error('Failed to save sticker data to localStorage:', error);
    }
  };
  
  // ステッカーをトグル（貼る・剥がす）
  const toggleSticker = (date: number) => {
    setStickerDates(prevDates => {
      const newDates = new Set(prevDates);
      if (newDates.has(date)) {
        newDates.delete(date);
      } else {
        newDates.add(date);
      }
      saveStickerDates(newDates);
      return newDates;
    });
  };
  
  // 統計情報を取得
  const getStats = () => {
    const totalStickers = stickerDates.size;
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const percentage = Math.round((totalStickers / daysInMonth) * 100);
    
    return {
      totalStickers,
      daysInMonth,
      percentage
    };
  };
  
  return {
    stickerDates,
    toggleSticker,
    getStats
  };
}