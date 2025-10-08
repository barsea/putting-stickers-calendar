-- RPC関数の曖昧性エラーを修正
-- 実行順序: このファイル全体をSupabaseのSQL Editorにコピー&ペーストして実行

-- 既存の関数を削除
DROP FUNCTION IF EXISTS public.create_user_profile();

-- 修正版: 変数名を明確に区別
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

  -- デフォルトラベルを作成（既存の場合は何もしない）
  INSERT INTO public.user_sticker_labels (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  RAISE NOTICE 'Profile created for user: %', v_user_id;
END;
$$;

-- 認証済みユーザーに実行権限を付与
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile() TO anon;

-- 確認メッセージ
SELECT 'Profile creation function fixed - ambiguous column error resolved' AS message;
