'use client';

import { useState, useEffect } from 'react';
import { User, SignUpData, LoginData, AuthState } from '@/types/auth';
import { validatePassword } from '@/utils/passwordValidation';

const AUTH_STORAGE_KEY = 'auth-state';
const USERS_STORAGE_KEY = 'users';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null
  });

  // LocalStorageから認証状態を復元
  useEffect(() => {
    try {
      const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedAuth) {
        const parsedAuth = JSON.parse(storedAuth);
        setAuthState(parsedAuth);
      }
    } catch (error) {
      console.error('Failed to load auth state from localStorage:', error);
    }
  }, []);

  // 認証状態をLocalStorageに保存
  const saveAuthState = (newState: AuthState) => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newState));
      setAuthState(newState);
    } catch (error) {
      console.error('Failed to save auth state to localStorage:', error);
    }
  };

  // ユーザーデータをLocalStorageから取得
  const getStoredUsers = (): User[] => {
    try {
      const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
      return storedUsers ? JSON.parse(storedUsers) : [];
    } catch (error) {
      console.error('Failed to load users from localStorage:', error);
      return [];
    }
  };

  // ユーザーデータをLocalStorageに保存
  const saveUsers = (users: User[]) => {
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Failed to save users to localStorage:', error);
    }
  };

  // 新規登録
  const signUp = async (signUpData: SignUpData): Promise<{ success: boolean; error?: string }> => {
    try {
      // パスワードバリデーション
      const passwordValidation = validatePassword(signUpData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors[0] };
      }

      const users = getStoredUsers();
      
      // メールアドレスの重複チェック
      if (users.some(user => user.email === signUpData.email)) {
        return { success: false, error: 'このメールアドレスは既に登録されています' };
      }

      // 新しいユーザーを作成
      const newUser: User = {
        id: Date.now().toString(), // 簡易的なID生成
        name: signUpData.name,
        email: signUpData.email
      };

      // ユーザーリストに追加
      users.push(newUser);
      saveUsers(users);

      // 自動ログイン
      saveAuthState({
        isAuthenticated: true,
        user: newUser
      });

      return { success: true };
    } catch (error) {
      console.error('Sign up failed:', error);
      return { success: false, error: '登録に失敗しました' };
    }
  };

  // ログイン
  const login = async (loginData: LoginData): Promise<{ success: boolean; error?: string }> => {
    try {
      const users = getStoredUsers();
      
      // ユーザーを検索（パスワードは簡易チェック）
      const user = users.find(u => u.email === loginData.email);
      
      if (!user) {
        return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
      }

      // ログイン成功
      saveAuthState({
        isAuthenticated: true,
        user: user
      });

      return { success: true };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  };

  // ログアウト
  const logout = () => {
    saveAuthState({
      isAuthenticated: false,
      user: null
    });
  };

  return {
    authState,
    signUp,
    login,
    logout
  };
}