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

        // サインアップ後にユーザープロファイルを作成
        if (event === 'SIGNED_IN' && session?.user) {
          await createUserProfile(session.user);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // ユーザープロファイルの作成
  const createUserProfile = async (user: User) => {
    try {
      // user_metadataからnameを取得
      const name = user.user_metadata?.name || user.email?.split('@')[0] || 'ユーザー';

      // トランザクションでユーザーとラベルを同時作成
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).rpc('create_user_with_labels', {
        user_id: user.id,
        user_name: name,
        user_email: user.email!
      });

      if (error && error.code !== '23505') { // 既存ユーザーは無視
        console.error('Failed to create user profile:', error);
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
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
            : error.message
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