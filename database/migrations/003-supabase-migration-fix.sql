-- ユーザーIDの型を文字列に変更するマイグレーション
-- カスタム認証システム対応のためのテーブル修正

-- 1. 既存の制約とトリガーを削除
DROP TRIGGER IF EXISTS update_user_stickers_updated_at ON user_stickers;
DROP TRIGGER IF EXISTS update_user_sticker_labels_updated_at ON user_sticker_labels;
DROP TRIGGER IF EXISTS create_default_labels_trigger ON users;

-- 2. 既存のRLSポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can view own labels" ON user_sticker_labels;

-- 3. 外部キー制約を削除
ALTER TABLE user_stickers DROP CONSTRAINT IF EXISTS user_stickers_user_id_fkey;
ALTER TABLE user_sticker_labels DROP CONSTRAINT IF EXISTS user_sticker_labels_user_id_fkey;

-- 4. テーブルを削除して再作成
DROP TABLE IF EXISTS user_stickers;
DROP TABLE IF EXISTS user_sticker_labels;
DROP TABLE IF EXISTS users;

-- 5. 新しいテーブル構造（文字列ID対応）
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,  -- UUIDではなく文字列
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,  -- 文字列型
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  day INTEGER NOT NULL,
  red BOOLEAN DEFAULT FALSE,
  blue BOOLEAN DEFAULT FALSE,
  green BOOLEAN DEFAULT FALSE,
  yellow BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, year, month, day)
);

CREATE TABLE user_sticker_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,  -- 文字列型
  red_label VARCHAR(20) DEFAULT '運動',
  blue_label VARCHAR(20) DEFAULT '勉強',
  green_label VARCHAR(20) DEFAULT '読書',
  yellow_label VARCHAR(20) DEFAULT '早起き',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 6. インデックスの再作成
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_stickers_user_date ON user_stickers(user_id, year, month);
CREATE INDEX idx_user_sticker_labels_user ON user_sticker_labels(user_id);

-- 7. updated_at関数とトリガーの再作成（セキュリティ警告対応）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_stickers_updated_at
    BEFORE UPDATE ON user_stickers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_sticker_labels_updated_at
    BEFORE UPDATE ON user_sticker_labels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Row Level Security (RLS) の有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels ENABLE ROW LEVEL SECURITY;

-- 9. RLSポリシーの再作成（カスタム認証対応）
-- 注意: この時点ではRLSポリシーは作成しません
-- セキュリティを考慮し、適切な認証システム実装後に設定する必要があります

-- TODO: 適切な認証システム実装後に以下のようなポリシーを設定
-- CREATE POLICY "Users can access own data" ON users FOR ALL USING (current_user_id() = id);
-- CREATE POLICY "Users can access own stickers" ON user_stickers FOR ALL USING (current_user_id() = user_id);
-- CREATE POLICY "Users can access own labels" ON user_sticker_labels FOR ALL USING (current_user_id() = user_id);

-- 10. デフォルトラベル作成関数の再作成（セキュリティ警告対応）
CREATE OR REPLACE FUNCTION create_default_labels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_sticker_labels (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. デフォルトラベル作成トリガーの再作成
CREATE TRIGGER create_default_labels_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_labels();

SELECT 'Database migration completed successfully!' AS message;