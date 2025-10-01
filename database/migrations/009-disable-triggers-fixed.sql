-- 全てのトリガーを無効化してテスト（修正版）
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 既存のトリガーを全て削除（存在するもののみ）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_user_stickers_updated_at ON user_stickers;
DROP TRIGGER IF EXISTS update_user_sticker_labels_updated_at ON user_sticker_labels;

-- 関連する関数も削除
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS create_default_labels();
DROP FUNCTION IF EXISTS create_user_with_labels(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- デバッグ用: 現在のトリガー状況を確認
SELECT 'Current triggers on auth.users:' AS debug_info;
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
AND event_object_schema = 'auth';

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

-- profilesテーブルの確認
SELECT 'profiles table check:' AS debug_info;
SELECT COUNT(*) as profile_count FROM profiles;

-- 完了メッセージ
SELECT 'All triggers disabled - pure Supabase Auth test' AS message;
SELECT 'User registration should work without any database triggers' AS info;
SELECT 'Now test user registration again' AS next_step;