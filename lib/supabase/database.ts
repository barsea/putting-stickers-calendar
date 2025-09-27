import { createClient } from './client';
import { Database, DayStickers, StickerLabels } from '@/types/database';
import { SupabaseClient } from '@supabase/supabase-js';

export class DatabaseService {
  private supabase: SupabaseClient<Database> = createClient();


  // ユーザー関連の操作
  async createUser(id: string, name: string, email: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('users')
      .insert({
        id, // カスタム認証システムのID（文字列）
        name,
        email,
        password_hash: '', // カスタム認証用の空文字
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create user:', {
        error: error,
        errorString: String(error),
        errorJSON: JSON.stringify(error),
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        data: { id, name, email }
      });
      throw error;
    }

    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get user:', error);
      throw error;
    }

    return data;
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Failed to get user:', error);
      throw error;
    }

    return data;
  }

  // ステッカー関連の操作
  async getStickers(userId: string, year: number, month: number) {
    const { data, error } = await this.supabase
      .from('user_stickers')
      .select('*')
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month);

    if (error) {
      console.error('Failed to get stickers:', error);
      throw error;
    }

    return this.convertToStickerMap(data);
  }

  private convertToStickerMap(data: Database['public']['Tables']['user_stickers']['Row'][]): Map<number, DayStickers> {
    // データをMapに変換
    const stickerMap = new Map<number, DayStickers>();
    data?.forEach((sticker) => {
      stickerMap.set(sticker.day, {
        red: sticker.red,
        blue: sticker.blue,
        green: sticker.green,
        yellow: sticker.yellow,
      });
    });

    return stickerMap;
  }

  async upsertSticker(
    userId: string,
    year: number,
    month: number,
    day: number,
    stickers: DayStickers
  ) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (this.supabase as any)
      .from('user_stickers')
      .upsert({
        user_id: userId,
        year,
        month,
        day,
        red: stickers.red,
        blue: stickers.blue,
        green: stickers.green,
        yellow: stickers.yellow,
      }, {
        onConflict: 'user_id,year,month,day' // unique制約の列を指定
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert sticker:', {
        error: error,
        errorString: String(error),
        errorJSON: JSON.stringify(error),
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        data: { userId, year, month, day, stickers }
      });
      throw error;
    }

    return data;
  }

  async deleteSticker(userId: string, year: number, month: number, day: number) {
    const { error } = await this.supabase
      .from('user_stickers')
      .delete()
      .eq('user_id', userId)
      .eq('year', year)
      .eq('month', month)
      .eq('day', day);

    if (error) {
      console.error('Failed to delete sticker:', error);
      throw error;
    }
  }

  // ラベル関連の操作
  async getLabels(userId: string): Promise<StickerLabels | null> {
    try {
      const { data, error } = await this.supabase
        .from('user_sticker_labels')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get labels:', error);
        // RLSエラーの場合はnullを返す（一時的な回避策）
        if (error.code === '42501' || error.message?.includes('not present in table')) {
          return null;
        }
        throw error;
      }

      if (!data) return null;

      return {
        red: (data as Database['public']['Tables']['user_sticker_labels']['Row']).red_label,
        blue: (data as Database['public']['Tables']['user_sticker_labels']['Row']).blue_label,
        green: (data as Database['public']['Tables']['user_sticker_labels']['Row']).green_label,
        yellow: (data as Database['public']['Tables']['user_sticker_labels']['Row']).yellow_label,
      };
    } catch (error) {
      console.error('Error in getLabels:', error);
      return null;
    }
  }

  async upsertLabels(userId: string, labels: StickerLabels) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (this.supabase as any)
        .from('user_sticker_labels')
        .upsert({
          user_id: userId,
          red_label: labels.red,
          blue_label: labels.blue,
          green_label: labels.green,
          yellow_label: labels.yellow,
        }, {
          onConflict: 'user_id' // unique制約の列を指定
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to upsert labels:', error);
        // RLSエラーの場合は無視（一時的な回避策）
        if (error.code === '42501' || error.message?.includes('not present in table')) {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in upsertLabels:', error);
      return null;
    }
  }

  // データ移行用のヘルパー関数
  async migrateUserStickers(
    userId: string,
    stickerData: Map<string, Map<number, DayStickers>> // key: "YYYY-MM"
  ) {
    const promises: Promise<Database['public']['Tables']['user_stickers']['Row']>[] = [];

    for (const [yearMonth, monthData] of stickerData.entries()) {
      const [year, month] = yearMonth.split('-').map(Number);

      for (const [day, stickers] of monthData.entries()) {
        // すべてのステッカーがfalseの場合はスキップ
        if (!Object.values(stickers).some(Boolean)) {
          continue;
        }

        promises.push(
          this.upsertSticker(userId, year, month, day, stickers)
        );
      }
    }

    await Promise.all(promises);
  }

  async migrateUserLabels(userId: string, labels: StickerLabels) {
    await this.upsertLabels(userId, labels);
  }
}

// シングルトンインスタンス
export const db = new DatabaseService();