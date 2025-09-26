-- ステッカーカレンダーアプリ用Supabaseテーブル作成スクリプト
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 1. usersテーブル: ユーザー情報を管理
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. user_stickersテーブル: ユーザーのステッカーデータを管理
CREATE TABLE user_stickers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- 3. user_sticker_labelsテーブル: ユーザーのステッカーラベルを管理
CREATE TABLE user_sticker_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  red_label VARCHAR(20) DEFAULT '運動',
  blue_label VARCHAR(20) DEFAULT '勉強',
  green_label VARCHAR(20) DEFAULT '読書',
  yellow_label VARCHAR(20) DEFAULT '早起き',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- インデックスの作成（パフォーマンス向上のため）
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_stickers_user_date ON user_stickers(user_id, year, month);
CREATE INDEX idx_user_sticker_labels_user ON user_sticker_labels(user_id);

-- updated_atフィールドの自動更新用トリガー関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーの作成
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

-- Row Level Security (RLS) の有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成
-- ユーザーは自分のレコードのみアクセス可能
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can view own stickers" ON user_stickers
    FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own labels" ON user_sticker_labels
    FOR ALL USING (auth.uid()::text = user_id::text);

-- 新規ユーザー登録時にデフォルトラベルを自動作成する関数
CREATE OR REPLACE FUNCTION create_default_labels()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_sticker_labels (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 新規ユーザー作成時にデフォルトラベルを作成するトリガー
CREATE TRIGGER create_default_labels_trigger
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_labels();

-- テーブル作成完了メッセージ
SELECT 'Supabase setup completed successfully!' AS message;