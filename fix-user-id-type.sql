-- user_idの型をUUIDからVARCHARに変更（カスタム認証システム対応）

-- 既存の外部キー制約を削除
ALTER TABLE user_stickers DROP CONSTRAINT IF EXISTS user_stickers_user_id_fkey;
ALTER TABLE user_sticker_labels DROP CONSTRAINT IF EXISTS user_sticker_labels_user_id_fkey;

-- user_idの型をVARCHARに変更
ALTER TABLE users ALTER COLUMN id TYPE VARCHAR(255);
ALTER TABLE user_stickers ALTER COLUMN user_id TYPE VARCHAR(255);
ALTER TABLE user_sticker_labels ALTER COLUMN user_id TYPE VARCHAR(255);

-- 外部キー制約を再作成
ALTER TABLE user_stickers ADD CONSTRAINT user_stickers_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE user_sticker_labels ADD CONSTRAINT user_sticker_labels_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

SELECT 'User ID type changed to VARCHAR for custom authentication' AS message;