'use client';

import { useState, useEffect } from 'react';

export type StickerType = 'red' | 'blue' | 'green' | 'yellow';

export interface DayStickers {
  red: boolean;
  blue: boolean;
  green: boolean;
  yellow: boolean;
}

export function useStickers(userId?: string) {
  const [stickerData, setStickerData] = useState<Map<number, DayStickers>>(new Map());
  
  // LocalStorageキーを現在の年月とユーザーIDで生成
  const getStorageKey = (userId?: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 月は0から始まるので+1
    const userPrefix = userId ? `user-${userId}-` : 'guest-';
    return `${userPrefix}sticker-calendar-${year}-${month}`;
  };
  
  // LocalStorageからデータを読み込み
  useEffect(() => {
    try {
      const storageKey = getStorageKey(userId);
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const dataObject = JSON.parse(storedData);
        const dataMap = new Map<number, DayStickers>();
        
        // 旧形式のデータ（number[]）から新形式への変換
        if (Array.isArray(dataObject)) {
          // 旧形式: 単一ステッカーの配列
          dataObject.forEach((date: number) => {
            dataMap.set(date, { red: false, blue: false, green: false, yellow: true });
          });
        } else {
          // 新形式: オブジェクト形式
          Object.entries(dataObject).forEach(([dateStr, stickers]) => {
            const date = parseInt(dateStr);
            dataMap.set(date, stickers as DayStickers);
          });
        }
        
        setStickerData(dataMap);
      }
    } catch (error) {
      console.error('Failed to load sticker data from localStorage:', error);
    }
  }, [userId]);
  
  // LocalStorageにデータを保存
  const saveStickerData = (data: Map<number, DayStickers>) => {
    try {
      const storageKey = getStorageKey(userId);
      const dataObject: Record<number, DayStickers> = {};
      data.forEach((stickers, date) => {
        dataObject[date] = stickers;
      });
      localStorage.setItem(storageKey, JSON.stringify(dataObject));
    } catch (error) {
      console.error('Failed to save sticker data to localStorage:', error);
    }
  };
  
  // 特定の日付のステッカー状態を取得
  const getDayStickers = (date: number): DayStickers => {
    return stickerData.get(date) || { red: false, blue: false, green: false, yellow: false };
  };
  
  // 特定のステッカーをトグル（貼る・剥がす）
  const toggleSticker = (date: number, stickerType: StickerType) => {
    setStickerData(prevData => {
      const newData = new Map(prevData);
      const currentStickers = getDayStickers(date);
      const newStickers = { ...currentStickers, [stickerType]: !currentStickers[stickerType] };
      
      // すべてのステッカーがfalseの場合は、その日のデータを削除
      if (!Object.values(newStickers).some(value => value)) {
        newData.delete(date);
      } else {
        newData.set(date, newStickers);
      }
      
      saveStickerData(newData);
      return newData;
    });
  };
  
  // 統計情報を取得
  const getStats = () => {
    let totalStickers = 0;
    let daysWithStickers = 0;
    
    stickerData.forEach((stickers) => {
      const stickerCount = Object.values(stickers).filter(Boolean).length;
      if (stickerCount > 0) {
        daysWithStickers++;
        totalStickers += stickerCount;
      }
    });
    
    const currentDate = new Date();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const percentage = Math.round((daysWithStickers / daysInMonth) * 100);
    
    return {
      totalStickers,
      daysWithStickers,
      daysInMonth,
      percentage
    };
  };
  
  return {
    stickerData,
    getDayStickers,
    toggleSticker,
    getStats
  };
}