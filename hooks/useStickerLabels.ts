'use client';

import { useState, useEffect } from 'react';
import { StickerType } from './useStickers';

export interface StickerLabels {
  red: string;
  blue: string;
  green: string;
  yellow: string;
}

const defaultLabels: StickerLabels = {
  red: '運動',
  blue: '勉強',
  green: '読書',
  yellow: '早起き'
};

export function useStickerLabels(userId?: string, year?: number, month?: number) {
  const [labels, setLabels] = useState<StickerLabels>(defaultLabels);

  const getStorageKey = (y?: number, m?: number) => {
    // 年月が指定されていない場合は現在の年月を使用
    const now = new Date();
    const targetYear = y ?? year ?? now.getFullYear();
    const targetMonth = m ?? month ?? now.getMonth() + 1;

    const userPrefix = userId ? `user-${userId}-` : 'guest-';
    return `${userPrefix}${targetYear}-${targetMonth}-labels`;
  };

  // 前月のラベルを取得する関数
  const getPreviousMonthLabels = (): StickerLabels | null => {
    try {
      const now = new Date();
      const targetYear = year ?? now.getFullYear();
      const targetMonth = month ?? now.getMonth() + 1;

      // 前月を計算
      let prevYear = targetYear;
      let prevMonth = targetMonth - 1;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear -= 1;
      }

      const prevStorageKey = getStorageKey(prevYear, prevMonth);
      const prevLabels = localStorage.getItem(prevStorageKey);

      if (prevLabels) {
        return JSON.parse(prevLabels);
      }
      return null;
    } catch (error) {
      console.error('Failed to get previous month labels:', error);
      return null;
    }
  };

  // LocalStorageからラベルを読み込み
  useEffect(() => {
    try {
      const storageKey = getStorageKey();
      const storedLabels = localStorage.getItem(storageKey);

      if (storedLabels) {
        // 新形式のデータが存在する場合はそのまま使用
        const parsedLabels = JSON.parse(storedLabels);
        setLabels(parsedLabels);
      } else {
        // 新形式のデータがない場合、旧形式からの移行を試みる
        const oldStorageKey = userId ? `user-${userId}-sticker-labels` : 'guest-sticker-labels';
        const oldLabels = localStorage.getItem(oldStorageKey);

        if (oldLabels) {
          // 旧形式データが存在する場合、新形式に移行
          const parsedOldLabels = JSON.parse(oldLabels);

          // 2025年10月のデータとして保存
          const migrationYear = 2025;
          const migrationMonth = 10;
          const userPrefix = userId ? `user-${userId}-` : 'guest-';
          const migrationKey = `${userPrefix}${migrationYear}-${migrationMonth}-labels`;

          localStorage.setItem(migrationKey, JSON.stringify(parsedOldLabels));

          // 旧形式のキーを削除
          localStorage.removeItem(oldStorageKey);

          console.log(`Migrated labels from ${oldStorageKey} to ${migrationKey}`);

          // 現在表示中の年月が2025年10月の場合は移行したデータを使用
          const now = new Date();
          const targetYear = year ?? now.getFullYear();
          const targetMonth = month ?? now.getMonth() + 1;

          if (targetYear === migrationYear && targetMonth === migrationMonth) {
            setLabels(parsedOldLabels);
          } else {
            // それ以外の月は前月ラベル引き継ぎまたはデフォルト
            const prevLabels = getPreviousMonthLabels();
            if (prevLabels) {
              // 前月のラベルを引き継ぐ
              localStorage.setItem(storageKey, JSON.stringify(prevLabels));
              setLabels(prevLabels);
              console.log(`Inherited labels from previous month for ${storageKey}`);
            } else {
              setLabels(defaultLabels);
            }
          }
        } else {
          // 旧形式も新形式もない場合、前月のラベルを確認
          const prevLabels = getPreviousMonthLabels();
          if (prevLabels) {
            // 前月のラベルを引き継いで保存
            localStorage.setItem(storageKey, JSON.stringify(prevLabels));
            setLabels(prevLabels);
            console.log(`Inherited labels from previous month for ${storageKey}`);
          } else {
            // 前月もない場合はデフォルトラベルを使用
            setLabels(defaultLabels);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load sticker labels from localStorage:', error);
      setLabels(defaultLabels);
    }
  }, [userId, year, month]);

  // LocalStorageにラベルを保存
  const saveLabels = (newLabels: StickerLabels) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(newLabels));
      setLabels(newLabels);
    } catch (error) {
      console.error('Failed to save sticker labels to localStorage:', error);
    }
  };

  // 特定の色のラベルを更新
  const updateLabel = (stickerType: StickerType, newLabel: string) => {
    // 20文字制限
    const trimmedLabel = newLabel.slice(0, 20);
    const newLabels = { ...labels, [stickerType]: trimmedLabel };
    saveLabels(newLabels);
  };

  // 特定の色のラベルを取得
  const getLabel = (stickerType: StickerType): string => {
    return labels[stickerType];
  };

  return {
    labels,
    updateLabel,
    getLabel
  };
}