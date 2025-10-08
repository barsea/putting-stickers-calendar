-- プロファイル自動作成トリガー（Supabase Auth対応）
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- profilesテーブルが存在しない場合は作成
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLSを有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーを削除（競合回避）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- RLSポリシーの再作成
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_stickersとuser_sticker_labelsのForeign Keyをprofilesに変更
-- まず既存の制約を削除
ALTER TABLE user_stickers DROP CONSTRAINT IF EXISTS user_stickers_user_id_fkey;
ALTER TABLE user_sticker_labels DROP CONSTRAINT IF EXISTS user_sticker_labels_user_id_fkey;

-- profilesを参照するように変更
ALTER TABLE user_stickers
  ADD CONSTRAINT user_stickers_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE user_sticker_labels
  ADD CONSTRAINT user_sticker_labels_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 既存のトリガーと関数を削除
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 新規ユーザー登録時に自動的にプロファイルとラベルを作成する関数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- プロファイルを作成
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.email
  );

  -- デフォルトラベルを作成
  INSERT INTO public.user_sticker_labels (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Supabase Authのusersテーブルにトリガーを設定
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- デバッグ用: 設定確認
SELECT 'Profiles trigger created successfully' AS message;

SELECT 'Checking trigger status:' AS debug_info;
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 完了メッセージ
SELECT 'Profile auto-creation is now enabled for new Supabase Auth users' AS final_message;
