'use client';

import { useStickers } from './useStickers';
import { useSupabaseStickers } from './useSupabaseStickers';
import { DayStickers, StickerType } from '@/types/database';

export function useHybridStickers(
  userId?: string,
  selectedYear?: number,
  selectedMonth?: number,
  isSupabaseAuth = false
) {
  const localStickers = useStickers(userId, selectedYear, selectedMonth);
  const supabaseStickers = useSupabaseStickers(userId, selectedYear, selectedMonth);

  // Supabase認証時はSupabaseのhookを使用、それ以外はLocalStorageのhookを使用
  if (isSupabaseAuth && userId) {
    return {
      ...supabaseStickers,
      // エラーハンドリング用の追加情報
      isOnline: !supabaseStickers.error,
      fallbackMode: false
    };
  } else {
    return {
      ...localStickers,
      // LocalStorageモード用の追加情報
      loading: false,
      error: null,
      isOnline: true, // LocalStorageは常にオンライン扱い
      fallbackMode: true
    };
  }
}