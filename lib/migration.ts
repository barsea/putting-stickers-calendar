import { db } from '@/lib/supabase/database';
import { DayStickers, StickerLabels } from '@/types/database';


export class DataMigrationService {
  // LocalStorageからゲストデータを取得
  private getGuestStickerData(): Map<string, Map<number, DayStickers>> {
    const stickerData = new Map<string, Map<number, DayStickers>>();

    // LocalStorageのすべてのキーをチェック
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith('guest-sticker-calendar-')) continue;

      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;

        const dataObject = JSON.parse(storedData);
        const monthData = new Map<number, DayStickers>();

        // 旧形式のデータ（number[]）から新形式への変換
        if (Array.isArray(dataObject)) {
          // 旧形式: 単一ステッカーの配列
          dataObject.forEach((date: number) => {
            monthData.set(date, { red: false, blue: false, green: false, yellow: true });
          });
        } else {
          // 新形式: オブジェクト形式
          Object.entries(dataObject).forEach(([dateStr, stickers]) => {
            const date = parseInt(dateStr);
            monthData.set(date, stickers as DayStickers);
          });
        }

        // キーから年月を抽出 (guest-sticker-calendar-YYYY-MM)
        const yearMonthMatch = key.match(/guest-sticker-calendar-(\d{4}-\d{1,2})$/);
        if (yearMonthMatch) {
          stickerData.set(yearMonthMatch[1], monthData);
        }
      } catch (error) {
        console.error(`Failed to parse sticker data for key ${key}:`, error);
      }
    }

    return stickerData;
  }

  // LocalStorageからゲストラベルを取得
  private getGuestLabels(): StickerLabels | null {
    try {
      const storedLabels = localStorage.getItem('guest-sticker-labels');
      if (!storedLabels) return null;

      return JSON.parse(storedLabels) as StickerLabels;
    } catch (error) {
      console.error('Failed to parse guest labels:', error);
      return null;
    }
  }

  // LocalStorageからユーザー別データを取得
  private getUserStickerData(localUserId: string): Map<string, Map<number, DayStickers>> {
    const stickerData = new Map<string, Map<number, DayStickers>>();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(`user-${localUserId}-sticker-calendar-`)) continue;

      try {
        const storedData = localStorage.getItem(key);
        if (!storedData) continue;

        const dataObject = JSON.parse(storedData);
        const monthData = new Map<number, DayStickers>();

        if (Array.isArray(dataObject)) {
          dataObject.forEach((date: number) => {
            monthData.set(date, { red: false, blue: false, green: false, yellow: true });
          });
        } else {
          Object.entries(dataObject).forEach(([dateStr, stickers]) => {
            const date = parseInt(dateStr);
            monthData.set(date, stickers as DayStickers);
          });
        }

        const yearMonthMatch = key.match(/user-\d+-sticker-calendar-(\d{4}-\d{1,2})$/);
        if (yearMonthMatch) {
          stickerData.set(yearMonthMatch[1], monthData);
        }
      } catch (error) {
        console.error(`Failed to parse sticker data for key ${key}:`, error);
      }
    }

    return stickerData;
  }

  // LocalStorageからユーザー別ラベルを取得
  private getUserLabels(localUserId: string): StickerLabels | null {
    try {
      const storedLabels = localStorage.getItem(`user-${localUserId}-sticker-labels`);
      if (!storedLabels) return null;

      return JSON.parse(storedLabels) as StickerLabels;
    } catch (error) {
      console.error(`Failed to parse user labels for user ${localUserId}:`, error);
      return null;
    }
  }

  // ゲストデータをSupabaseに移行
  async migrateGuestData(supabaseUserId: string): Promise<{
    success: boolean;
    migratedStickers: number;
    error?: string;
  }> {
    try {
      const stickerData = this.getGuestStickerData();
      const labels = this.getGuestLabels();

      let migratedStickers = 0;

      // ステッカーデータの移行
      for (const [yearMonth, monthData] of stickerData.entries()) {
        const [year, month] = yearMonth.split('-').map(Number);

        for (const [day, stickers] of monthData.entries()) {
          if (Object.values(stickers).some(Boolean)) {
            try {
              await db.upsertSticker(supabaseUserId, year, month, day, stickers);
              migratedStickers++;
            } catch (stickerError) {
              console.error(`Failed to migrate sticker for ${year}-${month}-${day}:`, stickerError);
              // 個別のステッカー移行失敗は続行
            }
          }
        }
      }

      // ラベルデータの移行（2025年10月のデータとして移行）
      if (labels) {
        try {
          await db.upsertLabels(supabaseUserId, 2025, 10, labels);
        } catch (labelError) {
          console.error('Failed to migrate labels:', labelError);
          // ラベル移行失敗は非致命的
        }
      }

      return {
        success: true,
        migratedStickers
      };
    } catch (error) {
      console.error('Failed to migrate guest data:', error);
      return {
        success: false,
        migratedStickers: 0,
        error: `データ移行に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // ローカルユーザーデータをSupabaseに移行
  async migrateUserData(localUserId: string, supabaseUserId: string): Promise<{
    success: boolean;
    migratedStickers: number;
    error?: string;
  }> {
    try {
      const stickerData = this.getUserStickerData(localUserId);
      const labels = this.getUserLabels(localUserId);

      let migratedStickers = 0;

      // ステッカーデータの移行
      for (const [yearMonth, monthData] of stickerData.entries()) {
        const [year, month] = yearMonth.split('-').map(Number);

        for (const [day, stickers] of monthData.entries()) {
          if (Object.values(stickers).some(Boolean)) {
            await db.upsertSticker(supabaseUserId, year, month, day, stickers);
            migratedStickers++;
          }
        }
      }

      // ラベルデータの移行（2025年10月のデータとして移行）
      if (labels) {
        await db.upsertLabels(supabaseUserId, 2025, 10, labels);
      }

      return {
        success: true,
        migratedStickers
      };
    } catch (error) {
      console.error('Failed to migrate user data:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      return {
        success: false,
        migratedStickers: 0,
        error: `データ移行に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // 移行後のクリーンアップ（LocalStorageデータの削除）
  cleanupLocalStorage(localUserId?: string) {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (localUserId) {
          // 特定ユーザーのデータのみ削除
          if (key.startsWith(`user-${localUserId}-sticker-`) ||
              key.startsWith(`user-${localUserId}-sticker-labels`)) {
            keysToRemove.push(key);
          }
        } else {
          // ゲストデータを削除
          if (key.startsWith('guest-sticker-')) {
            keysToRemove.push(key);
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Failed to cleanup localStorage:', error);
    }
  }
}

// シングルトンインスタンス
export const migrationService = new DataMigrationService();