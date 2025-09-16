'use client';

import { useStickers } from './useStickers';
import { useSupabaseStickers } from './useSupabaseStickers';
import { DayStickers, StickerType } from '@/types/database';

export function useHybridStickers(
  userId?: string,
  selectedYear?: number,
  selectedMonth?: number
) {
  const localStickers = useStickers(userId, selectedYear, selectedMonth);
  const supabaseStickers = useSupabaseStickers(userId, selectedYear, selectedMonth);

  // Supabase環境変数が設定されている場合のみSupabaseを使用
  const hasSupabaseEnv = !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
  );

  // Supabase環境が利用可能でユーザーIDがある場合はSupabaseのhookを使用
  if (hasSupabaseEnv && userId) {
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