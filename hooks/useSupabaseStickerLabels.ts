'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/supabase/database';
import { StickerLabels, StickerType } from '@/types/database';

const defaultLabels: StickerLabels = {
  red: '運動',
  blue: '勉強',
  green: '読書',
  yellow: '早起き'
};

export function useSupabaseStickerLabels(userId?: string) {
  const [labels, setLabels] = useState<StickerLabels>(defaultLabels);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabaseからラベルを読み込み
  useEffect(() => {
    if (!userId) {
      setLabels(defaultLabels);
      return;
    }

    // ゲストユーザー（数値ID）の場合はSupabaseアクセスをスキップ
    if (userId.match(/^\d+$/)) {
      setLabels(defaultLabels);
      return;
    }

    const loadLabels = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await db.getLabels(userId);
        if (data) {
          setLabels(data);
        } else {
          // ラベルがない場合はデフォルトラベルを作成
          await db.upsertLabels(userId, defaultLabels);
          setLabels(defaultLabels);
        }
      } catch (err) {
        console.error('Failed to load labels:', err);
        setError('ラベルの読み込みに失敗しました');
        // エラー時はデフォルトラベルを使用
        setLabels(defaultLabels);
      } finally {
        setLoading(false);
      }
    };

    loadLabels();
  }, [userId]);

  // 特定の色のラベルを更新
  const updateLabel = async (stickerType: StickerType, newLabel: string) => {
    if (!userId) {
      // ユーザーIDがない場合は何もしない（エラーを出さない）
      return;
    }

    // ゲストユーザー（数値ID）の場合はSupabaseアクセスをスキップ
    if (userId.match(/^\d+$/)) {
      return;
    }

    // 20文字制限
    const trimmedLabel = newLabel.slice(0, 20);
    const newLabels = { ...labels, [stickerType]: trimmedLabel };

    // 楽観的更新：UIを先に更新
    setLabels(newLabels);

    try {
      await db.upsertLabels(userId, newLabels);
      setError(null);
    } catch (err) {
      console.error('Failed to update label:', err);
      setError('ラベルの更新に失敗しました');

      // エラー時は元に戻す
      setLabels(labels);
    }
  };

  // 特定の色のラベルを取得
  const getLabel = (stickerType: StickerType): string => {
    return labels[stickerType];
  };

  return {
    labels,
    updateLabel,
    getLabel,
    loading,
    error
  };
}