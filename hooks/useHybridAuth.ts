'use client';

import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useAuth as useLocalAuth } from './useAuth';
import { migrationService } from '@/lib/migration';
import { db } from '@/lib/supabase/database';

export interface HybridAuthState {
  isAuthenticated: boolean;
  user: { id: string; name: string; email: string } | null;
  loading: boolean;
  isSupabaseAuth: boolean;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export function useHybridAuth() {
  const supabaseAuth = useSupabaseAuth();
  const localAuth = useLocalAuth();
  const [migrationStatus, setMigrationStatus] = useState<{
    inProgress: boolean;
    completed: boolean;
    error: string | null;
  }>({
    inProgress: false,
    completed: false,
    error: null
  });

  // Supabaseが利用可能かチェック
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);

  useEffect(() => {
    // 環境変数チェック
    const hasSupabaseEnv = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY
    );
    setSupabaseAvailable(hasSupabaseEnv);
  }, []);

  // 統合認証状態
  const authState: HybridAuthState = {
    isAuthenticated: supabaseAvailable
      ? supabaseAuth.authState.isAuthenticated
      : localAuth.authState.isAuthenticated,
    user: supabaseAvailable && supabaseAuth.authState.user
      ? {
          id: supabaseAuth.authState.user.id,
          name: supabaseAuth.authState.user.user_metadata?.name ||
                supabaseAuth.authState.user.email?.split('@')[0] || 'ユーザー',
          email: supabaseAuth.authState.user.email!
        }
      : localAuth.authState.user,
    loading: supabaseAvailable
      ? supabaseAuth.authState.loading
      : false,
    isSupabaseAuth: supabaseAvailable && supabaseAuth.authState.isAuthenticated
  };

  // データ移行処理
  const performDataMigration = async (supabaseUserId: string) => {
    if (migrationStatus.inProgress || migrationStatus.completed) return;

    setMigrationStatus({ inProgress: true, completed: false, error: null });

    try {
      // まずSupabaseにユーザーが存在することを確認・作成
      const authState = supabaseAuth.authState;
      console.log('Auth state for migration:', authState);
      console.log('Supabase user ID:', supabaseUserId);

      if (authState.isAuthenticated && authState.user) {
        try {
          // ユーザーが存在するか確認
          const existingUser = await db.getUserById(supabaseUserId);
          if (existingUser) {
            console.log('User already exists in Supabase');
          } else {
            throw new Error('User not found');
          }
        } catch (error) {
          // ユーザーが存在しない場合は作成
          console.log('Creating user in Supabase before migration...', {
            id: supabaseUserId,
            name: authState.user.name,
            email: authState.user.email
          });
          try {
            await db.createUser(supabaseUserId, authState.user.name, authState.user.email);
            console.log('User created successfully in Supabase');
          } catch (createError) {
            console.error('Failed to create user in Supabase:', createError);
            throw createError;
          }
        }
      } else {
        console.error('No authenticated user found for migration');
        throw new Error('User not authenticated - cannot proceed with migration');
      }

      // ゲストデータの移行
      const guestMigration = await migrationService.migrateGuestData(supabaseUserId);

      let totalMigratedStickers = guestMigration.migratedStickers;

      if (guestMigration.success && guestMigration.migratedStickers > 0) {
        migrationService.cleanupLocalStorage();
        console.log(`Migrated ${guestMigration.migratedStickers} guest stickers`);
      }

      setMigrationStatus({
        inProgress: false,
        completed: true,
        error: null
      });

      return { success: true, migratedStickers: totalMigratedStickers };
    } catch (error) {
      console.error('Migration failed:', error);
      setMigrationStatus({
        inProgress: false,
        completed: false,
        error: 'データ移行に失敗しました'
      });
      return { success: false, migratedStickers: 0 };
    }
  };

  // Supabase認証後の処理
  useEffect(() => {
    if (supabaseAvailable &&
        supabaseAuth.authState.isAuthenticated &&
        supabaseAuth.authState.user &&
        !migrationStatus.completed) {
      performDataMigration(supabaseAuth.authState.user.id);
    }
  }, [supabaseAuth.authState.isAuthenticated, supabaseAuth.authState.user?.id]);

  // サインアップ
  const signUp = async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    if (supabaseAvailable) {
      const result = await supabaseAuth.signUp(signUpData);
      if (result.success) {
        // サインアップ成功後、データ移行は useEffect で自動実行される
      }
      return result;
    } else {
      return localAuth.signUp(signUpData);
    }
  };

  // ログイン
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    if (supabaseAvailable) {
      const result = await supabaseAuth.login(loginData);
      if (result.success) {
        // ログイン成功後、データ移行は useEffect で自動実行される
      }
      return result;
    } else {
      return localAuth.login(loginData);
    }
  };

  // ログアウト
  const logout = async () => {
    if (supabaseAvailable) {
      await supabaseAuth.logout();
    } else {
      localAuth.logout();
    }

    // 移行状態をリセット
    setMigrationStatus({
      inProgress: false,
      completed: false,
      error: null
    });
  };

  return {
    authState,
    signUp,
    login,
    logout,
    migrationStatus,
    supabaseAvailable
  };
}