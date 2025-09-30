'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
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

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const supabase = createClient();

  useEffect(() => {
    // 初期認証状態の取得
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setAuthState({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          loading: false
        });
      } catch (error) {
        console.error('Failed to get initial session:', error);
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    getInitialSession();

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        setAuthState({
          isAuthenticated: !!session,
          user: session?.user ?? null,
          loading: false
        });

        // サインアップ後にプロファイル作成を確認・実行
        if (event === 'SIGNED_IN' && session?.user) {
          await ensureUserProfile(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ユーザープロファイルの確認・作成
  const ensureUserProfile = async (user: User) => {
    try {
      console.log('Ensuring user profile for:', user.id);

      // まずプロファイルが存在するか確認
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingProfile } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (existingProfile) {
        console.log('Profile already exists');
        return;
      }

      // プロファイルが存在しない場合は作成
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase as any)
        .from('profiles')
        .insert({
          id: user.id,
          name: name,
          email: user.email!
        });

      if (profileError) {
        console.error('Failed to create profile:', profileError);
        throw profileError;
      }

      // デフォルトラベルも作成
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: labelError } = await (supabase as any)
        .from('user_sticker_labels')
        .insert({
          user_id: user.id
        });

      if (labelError) {
        console.error('Failed to create default labels:', labelError);
        // ラベル作成失敗は非致命的なのでログだけ出力
      }

      console.log('Profile and labels created successfully');
    } catch (error) {
      console.error('Failed to ensure user profile:', error);
      // エラーは無視（ユーザー体験を阻害しないため）
    }
  };

  // サインアップ
  const signUp = async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name,
          }
        }
      });

      if (error) {
        console.error('Sign up failed:', error);
        return {
          success: false,
          error: error.message === 'User already registered'
            ? 'このメールアドレスは既に登録されています'
            : `登録エラー: ${error.message}`
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: '登録に失敗しました' };
    }
  };

  // ログイン
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        console.error('Login failed:', error);
        return {
          success: false,
          error: error.message === 'Invalid login credentials'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : error.message
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  };

  // ログアウト
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout failed:', error);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return {
    authState,
    signUp,
    login,
    logout
  };
}