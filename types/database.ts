// Supabaseデータベースの型定義

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; // UUID - Supabase Authのuser.idと同じ
          name: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // UUID - Supabase Authのuser.idと同じ
          name: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_stickers: {
        Row: {
          id: string;
          user_id: string; // UUID - Supabase Authのuser.idと同じ
          year: number;
          month: number;
          day: number;
          red: boolean;
          blue: boolean;
          green: boolean;
          yellow: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string; // UUID - Supabase Authのuser.idと同じ
          year: number;
          month: number;
          day: number;
          red?: boolean;
          blue?: boolean;
          green?: boolean;
          yellow?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          month?: number;
          day?: number;
          red?: boolean;
          blue?: boolean;
          green?: boolean;
          yellow?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sticker_labels: {
        Row: {
          id: string;
          user_id: string; // UUID - Supabase Authのuser.idと同じ
          red_label: string;
          blue_label: string;
          green_label: string;
          yellow_label: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string; // UUID - Supabase Authのuser.idと同じ
          red_label?: string;
          blue_label?: string;
          green_label?: string;
          yellow_label?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          red_label?: string;
          blue_label?: string;
          green_label?: string;
          yellow_label?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// 既存の型との互換性を保つための型定義
export type StickerType = 'red' | 'blue' | 'green' | 'yellow';

export interface DayStickers {
  red: boolean;
  blue: boolean;
  green: boolean;
  yellow: boolean;
}

export interface StickerLabels {
  red: string;
  blue: string;
  green: string;
  yellow: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}