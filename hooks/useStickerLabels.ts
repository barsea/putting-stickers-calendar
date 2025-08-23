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

export function useStickerLabels() {
  const [labels, setLabels] = useState<StickerLabels>(defaultLabels);
  
  const STORAGE_KEY = 'sticker-labels';
  
  // LocalStorageからラベルを読み込み
  useEffect(() => {
    try {
      const storedLabels = localStorage.getItem(STORAGE_KEY);
      if (storedLabels) {
        const parsedLabels = JSON.parse(storedLabels);
        setLabels(parsedLabels);
      }
    } catch (error) {
      console.error('Failed to load sticker labels from localStorage:', error);
    }
  }, []);
  
  // LocalStorageにラベルを保存
  const saveLabels = (newLabels: StickerLabels) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newLabels));
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