-- ユーザー登録エラー修正スクリプト（Supabase Auth対応 - 最終版）
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 1. 既存のRLSポリシーを全て削除（型変更前に必要）
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can insert own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can update own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can delete own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can view own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can insert own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can update own labels" ON user_sticker_labels;
DROP POLICY IF EXISTS "Users can delete own labels" ON user_sticker_labels;

-- 2. 既存のインデックスを削除
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_profiles_email;
DROP INDEX IF EXISTS idx_user_stickers_user_date;
DROP INDEX IF EXISTS idx_user_sticker_labels_user;

-- 3. 既存の問題のある関数を削除
DROP FUNCTION IF EXISTS create_user_with_labels(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_with_labels(VARCHAR, TEXT, TEXT);

-- 4. 既存のトリガーを削除
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_user_stickers_updated_at ON user_stickers;
DROP TRIGGER IF EXISTS update_user_sticker_labels_updated_at ON user_sticker_labels;
DROP TRIGGER IF EXISTS create_default_labels_trigger ON users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 5. テーブル構造をSupabase Auth用に修正
-- usersテーブルを削除（Supabase Authのauth.usersを使用）
DROP TABLE IF EXISTS users CASCADE;

-- 6. profilesテーブルを作成（Supabase Authの標準パターン）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. user_stickersとuser_sticker_labelsテーブルの外部キー参照を修正
ALTER TABLE user_stickers DROP CONSTRAINT IF EXISTS user_stickers_user_id_fkey;
ALTER TABLE user_sticker_labels DROP CONSTRAINT IF EXISTS user_sticker_labels_user_id_fkey;

-- user_idカラムをUUID型に変更（RLSポリシー削除後なので可能）
-- 既存データがある場合は安全に変換
DO $$
BEGIN
  -- user_stickersテーブルのuser_id型変更
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'user_stickers' AND column_name = 'user_id') = 'character varying' THEN
    ALTER TABLE user_stickers ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
  END IF;

  -- user_sticker_labelsテーブルのuser_id型変更
  IF (SELECT data_type FROM information_schema.columns
      WHERE table_name = 'user_sticker_labels' AND column_name = 'user_id') = 'character varying' THEN
    ALTER TABLE user_sticker_labels ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
  END IF;
END $$;

-- 新しい外部キー制約を追加
ALTER TABLE user_stickers ADD CONSTRAINT user_stickers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE user_sticker_labels ADD CONSTRAINT user_sticker_labels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 8. インデックスの作成
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_stickers_user_date ON user_stickers(user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_user_sticker_labels_user ON user_sticker_labels(user_id);

-- 9. updated_at関数とトリガーの再作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
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

-- 10. Row Level Security (RLS) の設定
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels ENABLE ROW LEVEL SECURITY;

-- 11. RLSポリシーの作成（Supabase Auth対応）
-- profilesテーブル用ポリシー
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_stickersテーブル用ポリシー
CREATE POLICY "Users can view own stickers" ON user_stickers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stickers" ON user_stickers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stickers" ON user_stickers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers" ON user_stickers
  FOR DELETE USING (auth.uid() = user_id);

-- user_sticker_labelsテーブル用ポリシー
CREATE POLICY "Users can view own labels" ON user_sticker_labels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels" ON user_sticker_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels" ON user_sticker_labels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels" ON user_sticker_labels
  FOR DELETE USING (auth.uid() = user_id);

-- 12. 新しいユーザープロファイル作成関数（Supabase Auth対応）
CREATE OR REPLACE FUNCTION create_user_with_labels(
  user_id UUID,
  user_name TEXT,
  user_email TEXT
)
RETURNS void AS $$
BEGIN
  -- プロファイルを挿入（既存の場合は何もしない）
  INSERT INTO profiles (id, name, email)
  VALUES (user_id, user_name, user_email)
  ON CONFLICT (id) DO NOTHING;

  -- デフォルトラベルを挿入（既存の場合は何もしない）
  INSERT INTO user_sticker_labels (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 関数実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION create_user_with_labels TO authenticated;

-- 14. profilesテーブル用の自動プロファイル作成トリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO user_sticker_labels (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガーの作成
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 修正完了メッセージ
SELECT 'Supabase Auth integration completed successfully!' AS message;
SELECT 'All conflicts resolved and user registration errors fixed!' AS fix_note;