-- RLSセキュリティの再設定（フロントエンド処理対応版）
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- RLSを再度有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sticker_labels ENABLE ROW LEVEL SECURITY;

-- profilesテーブル用のRLSポリシー（Supabase Auth対応）
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- user_stickersテーブル用のRLSポリシー
CREATE POLICY "Users can view own stickers" ON user_stickers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stickers" ON user_stickers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stickers" ON user_stickers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own stickers" ON user_stickers
  FOR DELETE USING (auth.uid() = user_id);

-- user_sticker_labelsテーブル用のRLSポリシー
CREATE POLICY "Users can view own labels" ON user_sticker_labels
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own labels" ON user_sticker_labels
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own labels" ON user_sticker_labels
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own labels" ON user_sticker_labels
  FOR DELETE USING (auth.uid() = user_id);

-- updated_at関数の再作成（セキュリティ確保版）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- updated_atトリガーの再作成（プロファイル更新時のみ）
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

-- デバッグ用: 最終状態の確認
SELECT 'RLS and security policies restored' AS message;

SELECT 'Tables with RLS enabled:' AS debug_info;
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_stickers', 'user_sticker_labels');

SELECT 'Active policies count:' AS debug_info;
SELECT
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'user_stickers', 'user_sticker_labels')
GROUP BY schemaname, tablename;

-- 完了メッセージ
SELECT 'Security restored - frontend-driven user creation is now secure' AS final_message;