-- RLSを一時的に無効化（開発用）
-- 注意: 本番環境では使用しないこと

-- RLSの無効化
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels DISABLE ROW LEVEL SECURITY;

SELECT 'RLS disabled for development testing' AS message;