-- プロファイル作成をRPC経由で行う方式に変更
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 既存のトリガーを削除（存在する場合）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- フロントエンドから呼び出すプロファイル作成関数
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_id UUID;
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- 現在の認証ユーザーIDを取得
  user_id := auth.uid();

  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- auth.usersからメールアドレスと名前を取得
  SELECT
    email,
    COALESCE(raw_user_meta_data->>'name', SPLIT_PART(email, '@', 1))
  INTO user_email, user_name
  FROM auth.users
  WHERE id = user_id;

  -- プロファイルを作成（既存の場合は何もしない）
  INSERT INTO public.profiles (id, name, email)
  VALUES (user_id, user_name, user_email)
  ON CONFLICT (id) DO NOTHING;

  -- デフォルトラベルを作成（既存の場合は何もしない）
  INSERT INTO public.user_sticker_labels (user_id)
  VALUES (user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Profile created for user: %', user_id;
END;
$$;

-- 認証済みユーザーに実行権限を付与
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO anon;

-- 確認メッセージ
SELECT 'Profile creation function created successfully' AS message;
SELECT 'Users must call create_user_profile() after sign up' AS note;
