-- RLS問題のデバッグ用マイグレーション
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 一時的にRLSを無効化してテスト
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels DISABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can insert own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can update own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can delete own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can view own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can insert own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can update own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can delete own labels" ON user_sticker_labels;

-- デバッグ用: 現在のテーブル状況を確認
SELECT 'Current tables and their RLS status:' AS debug_info;

SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_stickers', 'user_sticker_labels');

-- auth.usersテーブルの存在確認
SELECT 'auth.users table check:' AS debug_info;
SELECT COUNT(*) as user_count FROM auth.users;

-- 完了メッセージ
SELECT 'RLS disabled for debugging - user registration should work now' AS message;
SELECT 'Remember to re-enable RLS after testing!' AS warning;