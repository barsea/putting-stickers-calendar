# 運用・保守タスク

このドキュメントは、アプリケーションの継続的な運用・保守に必要なタスクをまとめたものです。

## 📅 定期メンテナンス

### 月次タスク（推奨: 毎月1回）

#### 1. 依存パッケージの更新
```bash
# セキュリティ監査
npm audit

# パッケージの更新確認
npm outdated

# 安全な更新（マイナー・パッチバージョン）
npm update

# ビルドテスト
npm run build

# TypeScript型チェック
npx tsc --noEmit
```

**現在の更新待ちパッケージ（2025-10-18時点）**:
- `eslint-config-next`: 15.3.1 → 15.5.6（マイナーバージョン、手動更新推奨）
- `lucide-react`: 0.511.0 → 0.546.0（マイナーバージョン、手動更新推奨）

**注意が必要な更新**:
- `@types/node`: 20.19.22 → 24.8.1（メジャーバージョンアップ）
  - Node.js 24対応の型定義、現行プロジェクトでは不要
- `tailwindcss`: 3.4.18 → 4.1.14（メジャーバージョンアップ）
  - v4は破壊的変更を含む可能性があるため、慎重に対応
  - 更新前にドキュメント確認: https://tailwindcss.com/docs/upgrade-guide

**セキュリティ状況**:
- 脆弱性: **0件** ✅（2025-10-18確認済み）

**最新更新履歴（2025-10-18）**:
- ✅ `@supabase/supabase-js`: 2.75.0 → 2.75.1
- ✅ `@types/node`: 20.19.21 → 20.19.22
- ✅ `eslint`: 9.37.0 → 9.38.0
- ✅ `next`: 15.5.5 → 15.5.6
- ✅ `tailwindcss`: 3.4.17 → 3.4.18

#### 2. Supabaseデータベース監視
- データベース容量の確認
- RLSポリシーの動作確認
- 不要データのクリーンアップ（必要に応じて）

### 四半期タスク（推奨: 3ヶ月に1回）

#### 1. パフォーマンス測定
```bash
# Lighthouseでパフォーマンス測定
# 本番環境: https://putting-stickers-calendar.vercel.app/
```

目標スコア:
- Performance: 90+ ✅
- Accessibility: 96+ ✅
- Best Practices: 100 ✅
- SEO: 91+ ✅

#### 2. ログレビュー
- Vercelダッシュボードでエラーログ確認
- クライアント側エラー（console.error）の確認
- 異常なアクセスパターンのチェック

## 🔒 セキュリティ

### 即時対応が必要な項目

#### 1. 環境変数のセキュリティ強化
- [x] `.env.local`がGit管理外であることを確認（`.gitignore`で除外済み）
- [x] `.env.example`でテンプレート提供済み
- [ ] `.env.local.example`の作成（推奨）
- [ ] Vercel環境変数の定期的な見直し

#### 2. セキュリティ脆弱性の監視
```bash
# 脆弱性チェック
npm audit

# 自動修正（可能な場合）
npm audit fix

# 強制修正（破壊的変更含む）
npm audit fix --force  # 注意: テスト必須
```

### セキュリティベストプラクティス

- [ ] **Dependabot有効化**（GitHub）
  - 自動的に依存パッケージの更新PRを作成
  - セキュリティアラートを通知

- [ ] **2要素認証（2FA）設定**
  - GitHubアカウント
  - Vercelアカウント
  - Supabaseアカウント

## 🚀 将来の改善提案

### 監視・ログ強化（優先度: 中）

#### 1. エラー追跡サービスの導入
**推奨ツール**: Sentry
```bash
npm install @sentry/nextjs
```

メリット:
- リアルタイムエラー通知
- スタックトレース自動収集
- ユーザー影響範囲の可視化

#### 2. アクセス解析の導入
**推奨ツール**: Google Analytics 4 または Vercel Analytics

メリット:
- ユーザー行動の理解
- 人気機能の特定
- パフォーマンス問題の早期発見

### 機能追加案（優先度: 低）

- [ ] **ステッカーカスタマイズ**: 複数の種類から選択可能
- [ ] **データエクスポート機能**: CSV/JSON形式でダウンロード
- [ ] **リマインダー機能**: 習慣実行の通知
- [ ] **統計グラフ**: 月別・年別の達成率グラフ表示
- [ ] **共有機能**: SNSへの達成状況シェア

## 📝 バックアップ

### Supabaseデータのバックアップ

**手動バックアップ**:
1. Supabaseダッシュボード → Database → Backups
2. 定期的にバックアップを確認
3. 重要なデータは手動エクスポート

**自動バックアップ**:
- Supabaseの自動バックアップ機能を確認
- 保持期間の設定確認

## 🔄 更新手順

### 依存パッケージ更新時の標準フロー

1. **更新前の確認**
   ```bash
   git status  # クリーンな状態を確認
   npm outdated  # 更新対象を確認
   ```

2. **更新実行**
   ```bash
   npm update  # 安全な更新
   # または
   npm install <package>@latest  # 特定パッケージの最新版
   ```

3. **動作確認**
   ```bash
   npx tsc --noEmit  # 型チェック
   npm run build  # ビルドテスト
   npm run dev  # ローカル動作確認
   ```

4. **コミット**
   ```bash
   git add package.json package-lock.json
   git commit -m "依存パッケージ更新: <更新内容>"
   ```

5. **デプロイ前テスト**
   - Vercelのプレビューデプロイで確認
   - 主要機能の動作確認

6. **本番デプロイ**
   ```bash
   git push origin main
   ```

## 📞 トラブルシューティング

### よくある問題と対処法

#### ビルドエラーが発生した場合
1. `node_modules`と`package-lock.json`を削除
2. `npm install`で再インストール
3. `npm run build`で再ビルド

#### Supabase接続エラー
1. 環境変数の確認（`.env.local`）
2. Supabaseプロジェクトの稼働状況確認
3. APIキーの有効期限確認

#### 型エラーが発生した場合
1. `npx tsc --noEmit`で詳細確認
2. 型定義パッケージの更新確認
3. `types/`ディレクトリの型定義見直し

## 📚 関連ドキュメント

- [Next.js アップグレードガイド](https://nextjs.org/docs/upgrading)
- [React アップグレードガイド](https://react.dev/blog/2022/03/08/react-18-upgrade-guide)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Tailwind CSS アップグレードガイド](https://tailwindcss.com/docs/upgrade-guide)

---

**最終更新**: 2025-10-18
**次回レビュー推奨日**: 2025-11-18
