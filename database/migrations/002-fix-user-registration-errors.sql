-- ユーザー登録エラー修正スクリプト
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 既存のトリガーを削除（競合を避けるため）
DROP TRIGGER IF EXISTS create_default_labels_trigger ON users;
DROP FUNCTION IF EXISTS create_default_labels();

-- 新しいトランザクション関数を作成
CREATE OR REPLACE FUNCTION create_user_with_labels(
  user_id UUID,
  user_name TEXT,
  user_email TEXT
)
RETURNS void AS $$
BEGIN
  -- ユーザープロファイルを挿入（既存の場合は何もしない）
  INSERT INTO users (id, name, email, password_hash)
  VALUES (user_id, user_name, user_email, '')
  ON CONFLICT (id) DO NOTHING;

  -- デフォルトラベルを挿入（既存の場合は何もしない）
  INSERT INTO user_sticker_labels (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数実行権限を認証済みユーザーに付与
GRANT EXECUTE ON FUNCTION create_user_with_labels TO authenticated;

-- 修正完了メッセージ
SELECT 'User registration errors fixed!' AS message;
SELECT 'Transaction function created for safe user creation' AS fix_note;