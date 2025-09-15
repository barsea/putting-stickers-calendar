'use client';

import { useStickerLabels } from './useStickerLabels';
import { useSupabaseStickerLabels } from './useSupabaseStickerLabels';
import { StickerType } from '@/types/database';

export function useHybridStickerLabels(userId?: string, isSupabaseAuth = false) {
  const localLabels = useStickerLabels(userId);
  const supabaseLabels = useSupabaseStickerLabels(userId);

  // Supabase認証時はSupabaseのhookを使用、それ以外はLocalStorageのhookを使用
  if (isSupabaseAuth && userId) {
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