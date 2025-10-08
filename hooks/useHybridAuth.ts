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
        // Supabaseトリガーによって自動的にプロファイルが作成されるため、確認のみ行う
        console.log('User authenticated, proceeding with migration for:', supabaseUserId);
      } else {
        console.error('No authenticated user found for migration');
        // 認証されていない場合は移行をスキップ（エラーにしない）
        setMigrationStatus({
          inProgress: false,
          completed: true,
          error: null
        });
        return { success: true, migratedStickers: 0 };
      }

      // タイムアウト付きで移行処理を実行（10秒）
      const migrationPromise = migrationService.migrateGuestData(supabaseUserId);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Migration timeout')), 10000)
      );

      const guestMigration = await Promise.race([migrationPromise, timeoutPromise])
        .catch((error) => {
          console.error('Migration failed or timed out:', error);
          // 移行失敗でもログイン自体は成功させる
          return { success: false, migratedStickers: 0, error: String(error) };
        });

      let totalMigratedStickers = guestMigration.migratedStickers;

      if (guestMigration.success && guestMigration.migratedStickers > 0) {
        migrationService.cleanupLocalStorage();
        console.log(`Migrated ${guestMigration.migratedStickers} guest stickers`);
      } else if (!guestMigration.success) {
        console.warn('Migration failed, but user can still use the app:', guestMigration.error);
      }

      // 移行の成否に関わらず、completed状態にする（ログインは成功）
      setMigrationStatus({
        inProgress: false,
        completed: true,
        error: guestMigration.success ? null : (guestMigration.error || 'データ移行に失敗しました（アプリは利用可能です）')
      });

      return { success: true, migratedStickers: totalMigratedStickers };
    } catch (error) {
      console.error('Migration failed with exception:', error);
      // エラーが発生してもログイン自体は成功させる
      setMigrationStatus({
        inProgress: false,
        completed: true,
        error: 'データ移行に失敗しました（アプリは利用可能です）'
      });
      return { success: true, migratedStickers: 0 };
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