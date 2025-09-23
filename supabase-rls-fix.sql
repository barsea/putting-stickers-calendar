-- RLS無効化スクリプト（独自認証システム対応）
-- 既存のRLSポリシーを削除してRLSを無効化

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can view own labels" ON user_sticker_labels;

-- RLSを無効化（独自認証システムでアプリケーションレベルでアクセス制御）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels DISABLE ROW LEVEL SECURITY;

-- 実行完了メッセージ
SELECT 'RLS disabled for custom authentication system' AS message;