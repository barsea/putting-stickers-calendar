'use client';

import { useStickerLabels } from './useStickerLabels';
import { useSupabaseStickerLabels } from './useSupabaseStickerLabels';
import { StickerType } from '@/types/database';

export function useHybridStickerLabels(userId?: string, isSupabaseAuth = false) {
  // 両方のhookを常に呼び出す（React Hooksの規則に従う）
  const localLabels = useStickerLabels(userId);
  const supabaseLabels = useSupabaseStickerLabels(userId);

  // Supabase認証時で、UUIDのユーザーIDがある場合はSupabaseの結果を使用
  // 数値IDの場合はゲストユーザーとして扱い、LocalStorageを使用
  const isSupabaseUser = isSupabaseAuth && userId && !userId.match(/^\d+$/);

  if (isSupabaseUser) {
    return {
      ...supabaseLabels,
      // エラーハンドリング用の追加情報
      isOnline: !supabaseLabels.error,
      fallbackMode: false
    };
  } else {
    return {
      ...localLabels,
      // LocalStorageモード用の追加情報
      loading: false,
      error: null,
      isOnline: true, // LocalStorageは常にオンライン扱い
      fallbackMode: true
    };
  }
}