# 画像ダウンローダー Chrome拡張機能

Webページから画像を簡単にダウンロードできるChrome拡張機能です。

## 🚀 機能

- **画像検出**: Webページ内の画像を自動検出
- **ワンクリックダウンロード**: 画像にホバーしてダウンロードボタンをクリック
- **一括ダウンロード**: ページ内のすべての画像を一度にダウンロード
- **カスタマイズ可能**: 保存先フォルダやファイル名形式を設定可能
- **通知機能**: ダウンロードの開始・完了を通知

## 🛠️ 開発環境

### 必要条件

- Node.js 24以上
- npm または yarn
- Chrome ブラウザ

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone <repository-url>
   cd image-downloader
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

3. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

4. **Chrome拡張機能の読み込み**
   - Chromeで `chrome://extensions/` を開く
   - 「デベロッパーモード」を有効にする
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - `dist` フォルダを選択

## 📁 プロジェクト構造

```
image-downloader/
├── .devcontainer/          # devcontainer設定
├── src/                    # ソースコード
│   ├── background.ts       # バックグラウンドスクリプト
│   ├── content.ts          # コンテンツスクリプト
│   ├── popup.html          # ポップアップ画面
│   ├── popup.ts            # ポップアップスクリプト
│   ├── options.html        # 設定画面
│   ├── options.ts          # 設定スクリプト
│   └── types/              # 型定義
├── public/                 # 静的ファイル
│   └── icons/              # アイコンファイル
├── dist/                   # ビルド出力
├── manifest.json           # 拡張機能マニフェスト
├── package.json            # プロジェクト設定
├── webpack.config.js       # Webpack設定
├── tsconfig.json           # TypeScript設定
└── README.md               # このファイル
```

## 🏗️ ビルド

### 開発ビルド
```bash
npm run dev
```

### 本番ビルド
```bash
npm run build
```

### リント
```bash
npm run lint
npm run lint:fix
```

### フォーマット
```bash
npm run format
```

## 🔧 設定

拡張機能の設定は以下の項目をカスタマイズできます：

- **保存先フォルダ**: ダウンロードした画像の保存先
- **ファイル名形式**: 元のファイル名、タイムスタンプ付き、連番付き
- **自動ダウンロード**: ホバー時の自動ダウンロード
- **通知表示**: ダウンロード通知の表示/非表示

## 🚀 使用方法

1. **拡張機能をインストール**
   - Chrome拡張機能ストアからインストール（公開後）
   - または開発版として読み込み

2. **画像のダウンロード**
   - 画像にマウスをホバー
   - 表示されるダウンロードボタン（📥）をクリック
   - または拡張機能アイコンをクリックして「すべての画像をダウンロード」

3. **設定の変更**
   - 拡張機能アイコンをクリック
   - 「設定」ボタンをクリック
   - 必要な設定を変更して保存

## 🐛 トラブルシューティング

### 拡張機能が動作しない場合
1. Chrome拡張機能ページで拡張機能が有効になっているか確認
2. ページを再読み込み
3. 拡張機能を再読み込み

### ダウンロードが失敗する場合
1. 画像のURLが有効か確認
2. 保存先フォルダの権限を確認
3. Chromeのダウンロード設定を確認

## 🤝 貢献

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 🙏 謝辞

- Chrome Extensions API
- TypeScript
- Webpack
- ESLint & Prettier

## 📞 サポート

問題や質問がある場合は、GitHubのIssuesページでお知らせください。 