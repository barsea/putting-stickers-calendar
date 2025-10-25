'use client';

import { useState, useRef } from 'react';
import { StickerType } from '@/hooks/useStickers';
import { useHybridStickerLabels } from '@/hooks/useHybridStickerLabels';

const stickerColors = {
  red: { bg: 'bg-red-500', text: 'text-red-600', hover: 'hover:bg-red-50' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-600', hover: 'hover:bg-blue-50' },
  green: { bg: 'bg-green-500', text: 'text-green-700', hover: 'hover:bg-green-50' },
  yellow: { bg: 'bg-yellow-500', text: 'text-yellow-700', hover: 'hover:bg-yellow-50' }
} as const;

interface StickerLabelsProps {
  userId?: string;
  year: number;
  month: number;
  isSupabaseAuth?: boolean;
}

export default function StickerLabels({ userId, year, month, isSupabaseAuth = false }: StickerLabelsProps) {
  const { labels, updateLabel } = useHybridStickerLabels(userId, year, month, isSupabaseAuth);
  const [editingSticker, setEditingSticker] = useState<StickerType | null>(null);
  const [editValue, setEditValue] = useState('');
  const isComposingRef = useRef(false);

  const startEditing = (stickerType: StickerType) => {
    setEditingSticker(stickerType);
    setEditValue(labels[stickerType]);
  };

  const saveEdit = () => {
    if (editingSticker) {
      updateLabel(editingSticker, editValue);
      setEditingSticker(null);
      setEditValue('');
    }
  };

  const cancelEdit = () => {
    setEditingSticker(null);
    setEditValue('');
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (!isComposingRef.current) {
        saveEdit();
      }
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const stickerTypes: StickerType[] = ['red', 'blue', 'green', 'yellow'];

  return (
    <div className="p-3 sm:p-4 bg-gray-50 border-t">
      <div className="text-center text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
        各色のエリアをタップしてステッカーを貼ろう！
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {stickerTypes.map((stickerType) => {
          const colorClasses = stickerColors[stickerType];
          const isEditing = editingSticker === stickerType;
          
          return (
            <div key={stickerType} className="flex items-center gap-2 sm:gap-2">
              <div className={`w-3 h-3 sm:w-4 sm:h-4 ${colorClasses.bg} rounded-full flex-shrink-0`}></div>
              
              {isEditing ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={handleKeyDown}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  maxLength={20}
                  className="flex-1 px-2 py-1.5 sm:py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-400 bg-white"
                  placeholder="ラベルを入力..."
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => startEditing(stickerType)}
                  className={`flex-1 text-left px-2 py-1.5 sm:py-1 text-xs sm:text-sm ${colorClasses.text} ${colorClasses.hover} rounded transition-colors`}
                >
                  {labels[stickerType] || 'ラベルなし'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="text-center text-xs text-gray-500 mt-2 sm:mt-2">
        ラベルをクリックして編集できます（最大20文字）
      </div>
    </div>
  );
}