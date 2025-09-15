'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/supabase/database';
import { DayStickers, StickerType } from '@/types/database';

export function useSupabaseStickers(userId?: string, selectedYear?: number, selectedMonth?: number) {
  const [stickerData, setStickerData] = useState<Map<number, DayStickers>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在の日付を取得（デフォルト値として使用）
  const now = new Date();
  const currentYear = selectedYear ?? now.getFullYear();
  const currentMonth = selectedMonth ?? (now.getMonth() + 1);

  // Supabaseからデータを読み込み
  useEffect(() => {
    if (!userId) {
      setStickerData(new Map());
      return;
    }

    const loadStickers = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await db.getStickers(userId, currentYear, currentMonth);
        setStickerData(data);
      } catch (err) {
        console.error('Failed to load stickers:', err);
        setError('ステッカーデータの読み込みに失敗しました');
        // エラー時はローカルデータで代替（オフライン対応）
        setStickerData(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadStickers();
  }, [userId, currentYear, currentMonth]);

  // 特定の日付のステッカー状態を取得
  const getDayStickers = (date: number): DayStickers => {
    return stickerData.get(date) || { red: false, blue: false, green: false, yellow: false };
  };

  // 特定のステッカーをトグル（貼る・剥がす）
  const toggleSticker = async (date: number, stickerType: StickerType) => {
    if (!userId) {
      setError('ログインが必要です');
      return;
    }

    const currentStickers = getDayStickers(date);
    const newStickers = { ...currentStickers, [stickerType]: !currentStickers[stickerType] };

    // 楽観的更新：UIを先に更新
    setStickerData(prevData => {
      const newData = new Map(prevData);

      // すべてのステッカーがfalseの場合は、その日のデータを削除
      if (!Object.values(newStickers).some(value => value)) {
        newData.delete(date);
      } else {
        newData.set(date, newStickers);
      }

      return newData;
    });

    try {
      // すべてのステッカーがfalseの場合は削除
      if (!Object.values(newStickers).some(value => value)) {
        await db.deleteSticker(userId, currentYear, currentMonth, date);
      } else {
        await db.upsertSticker(userId, currentYear, currentMonth, date, newStickers);
      }

      setError(null);
    } catch (err) {
      console.error('Failed to toggle sticker:', err);
      setError('ステッカーの更新に失敗しました');

      // エラー時は元に戻す
      setStickerData(prevData => {
        const newData = new Map(prevData);

        if (!Object.values(currentStickers).some(value => value)) {
          newData.delete(date);
        } else {
          newData.set(date, currentStickers);
        }

        return newData;
      });
    }
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

    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const percentage = Math.round((daysWithStickers / daysInMonth) * 100);

    return {
      totalStickers,
      daysWithStickers,
      daysInMonth,
      percentage,
      year: currentYear,
      month: currentMonth
    };
  };

  return {
    stickerData,
    getDayStickers,
    toggleSticker,
    getStats,
    loading,
    error
  };
}