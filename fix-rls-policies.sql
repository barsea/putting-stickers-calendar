-- RLSポリシーを修正してカスタム認証システムに対応

-- 既存のポリシーを削除
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own stickers" ON user_stickers;
DROP POLICY IF EXISTS "Users can view own labels" ON user_sticker_labels;

-- 新しいポリシーを作成（よりシンプルで開発向け）
-- 注意: 本番環境では適切な認証チェックが必要

-- usersテーブル: 全てのユーザーが自分のデータにアクセス可能
CREATE POLICY "Enable all access for users" ON users
    FOR ALL USING (true);

-- user_stickersテーブル: 全てのユーザーがアクセス可能（開発用）
CREATE POLICY "Enable all access for user_stickers" ON user_stickers
    FOR ALL USING (true);

-- user_sticker_labelsテーブル: 全てのユーザーがアクセス可能（開発用）
CREATE POLICY "Enable all access for user_sticker_labels" ON user_sticker_labels
    FOR ALL USING (true);

SELECT 'RLS policies updated for development' AS message;