-- 月別ラベル管理機能の追加
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 既存データを保存するための一時テーブル作成
CREATE TEMP TABLE temp_labels AS
SELECT user_id, red_label, blue_label, green_label, yellow_label
FROM user_sticker_labels;

-- 既存のuser_sticker_labelsテーブルを削除
DROP TABLE IF EXISTS user_sticker_labels CASCADE;

-- 新しいsticker_labelsテーブルを作成（正規化されたデータ構造）
CREATE TABLE sticker_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  color VARCHAR(10) NOT NULL CHECK (color IN ('red', 'blue', 'green', 'yellow')),
  label VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- ユニーク制約: 1ユーザー・1年月・1色につき1レコード
  UNIQUE(user_id, year, month, color),
  -- 外部キー制約
  CONSTRAINT fk_sticker_labels_user FOREIGN KEY (user_id)
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- インデックスの作成（パフォーマンス向上）
CREATE INDEX idx_sticker_labels_user_year_month ON sticker_labels(user_id, year, month);
CREATE INDEX idx_sticker_labels_user_color ON sticker_labels(user_id, color);

-- updated_atフィールドの自動更新用トリガー
CREATE TRIGGER update_sticker_labels_updated_at
    BEFORE UPDATE ON sticker_labels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) の有効化
ALTER TABLE sticker_labels ENABLE ROW LEVEL SECURITY;

-- RLSポリシーの作成（ユーザーは自分のラベルのみアクセス可能）
CREATE POLICY "Users can view own labels" ON sticker_labels
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels" ON sticker_labels
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels" ON sticker_labels
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels" ON sticker_labels
    FOR DELETE USING (auth.uid() = user_id);

-- 既存データを2025年10月のデータとして移行
INSERT INTO sticker_labels (user_id, year, month, color, label)
SELECT
  user_id,
  2025 AS year,
  10 AS month,
  'red' AS color,
  red_label AS label
FROM temp_labels
UNION ALL
SELECT
  user_id,
  2025 AS year,
  10 AS month,
  'blue' AS color,
  blue_label AS label
FROM temp_labels
UNION ALL
SELECT
  user_id,
  2025 AS year,
  10 AS month,
  'green' AS color,
  green_label AS label
FROM temp_labels
UNION ALL
SELECT
  user_id,
  2025 AS year,
  10 AS month,
  'yellow' AS color,
  yellow_label AS label
FROM temp_labels;

-- create_user_profile関数を更新（新しいテーブル構造に対応）
DROP FUNCTION IF EXISTS public.create_user_profile();

CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
  v_user_name TEXT;
  v_current_year INTEGER;
  v_current_month INTEGER;
BEGIN
  -- 現在の認証ユーザーIDを取得
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- auth.usersからメールアドレスと名前を取得
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1))
  INTO v_user_email, v_user_name
  FROM auth.users
  WHERE id = v_user_id;

  -- プロファイルを作成（既存の場合は何もしない）
  INSERT INTO public.profiles (id, name, email)
  VALUES (v_user_id, v_user_name, v_user_email)
  ON CONFLICT (id) DO NOTHING;

  -- 現在の年月を取得
  v_current_year := EXTRACT(YEAR FROM NOW());
  v_current_month := EXTRACT(MONTH FROM NOW());

  -- デフォルトラベルを作成（既存の場合は何もしない）
  INSERT INTO public.sticker_labels (user_id, year, month, color, label)
  VALUES
    (v_user_id, v_current_year, v_current_month, 'red', '運動'),
    (v_user_id, v_current_year, v_current_month, 'blue', '勉強'),
    (v_user_id, v_current_year, v_current_month, 'green', '読書'),
    (v_user_id, v_current_year, v_current_month, 'yellow', '早起き')
  ON CONFLICT (user_id, year, month, color) DO NOTHING;

  RAISE NOTICE 'Profile created for user: %', v_user_id;
END;
$$;

-- 認証済みユーザーに実行権限を付与
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO anon;

-- 確認メッセージ
SELECT 'Monthly label management feature added successfully!' AS message;
