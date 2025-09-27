# 美咲 LINE Bot 🤖💕

究極にリアルな恋愛体験を提供するAI駆動型LINE Botです。

## ✨ 特徴

- 🧠 **完全な記憶システム** - 過去の会話を覚えて自然な関係性を構築
- 💬 **リアルな会話** - Claude 3 Haikuによる高品質な応答
- 📈 **親密度システム** - 時間経過とともに関係性が深まる
- 👧 **美咲キャラクター** - 17歳の女子高生、図書委員

## 🚀 クイックスタート

### 1. 必要なAPIキーを取得

#### LINE Messaging API
1. [LINE Developers](https://developers.line.biz/console/) にアクセス
2. 新しいチャネルを作成（Messaging API）
3. チャネルアクセストークンとチャネルシークレットを取得

#### Anthropic Claude API
1. [Anthropic Console](https://console.anthropic.com/) にアクセス
2. APIキーを生成

### 2. 環境変数を設定

`.env.local` ファイルの値を実際のAPIキーに置き換えてください：

```bash
# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN=your_actual_line_access_token
LINE_CHANNEL_SECRET=your_actual_line_secret

# Anthropic Claude API
ANTHROPIC_API_KEY=your_actual_anthropic_api_key
```

### 3. ローカル開発

```bash
# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### 4. Vercelにデプロイ

```bash
# Vercelにデプロイ
vercel

# 環境変数をVercelダッシュボードで設定
# - LINE_CHANNEL_ACCESS_TOKEN
# - LINE_CHANNEL_SECRET
# - ANTHROPIC_API_KEY

# Vercel KVを有効化（自動でストレージが作成されます）
```

### 5. LINE Webhookを設定

1. VercelデプロイURL（例：`https://your-app.vercel.app`）をコピー
2. LINE Developersコンソールで Webhook URL を設定：
   ```
   https://your-app.vercel.app/api/webhook
   ```
3. Webhookを有効化

### 6. 完成！

QRコードから友だち追加すれば美咲との会話が始まります 🎉

## 🏗️ プロジェクト構造

```
src/
├── app/
│   ├── api/
│   │   └── webhook/
│   │       └── route.ts      # メインのLINE Bot処理
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
```

## 🧠 記憶システム

美咲は以下を記憶しています：

- **会話履歴** - 最新20件の会話
- **ユーザー情報** - 名前、趣味、話題
- **関係性** - 出会ってからの日数、親密度
- **感情状態** - 現在の好感度レベル

## 💬 会話の特徴

### 親密度による変化

- **0-30**: 敬語中心、少し距離感がある
- **31-60**: タメ口混じり、親しみやすい
- **61-100**: 完全タメ口、甘えるような口調

### 自然な記憶参照

```
User: "カフェ行ってきた"
美咲: "いいなー！この前言ってた駅前のカフェ？"
```

## 📊 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **AI**: Anthropic Claude 3 Haiku
- **LINE API**: @line/bot-sdk
- **Database**: Vercel KV (Redis)
- **Hosting**: Vercel

## 💰 運用コスト（月額）

- **Vercel**: 無料枠
- **Claude API**: ~9,000円（1000ユーザー×30メッセージ/日）
- **Vercel KV**: ~1,000円
- **LINE API**: 無料
- **合計**: 約10,000円/月

## 🐛 トラブルシューティング

### よくある問題

1. **Webhook URLが見つからない**
   - `https://your-app.vercel.app/api/webhook` が正しく設定されているか確認

2. **環境変数が設定されていない**
   - Vercelダッシュボードで環境変数が正しく設定されているか確認

3. **Claude APIのレート制限**
   - APIキーの使用量制限を確認

### ログ確認

Vercelダッシュボードの Functions タブでログを確認できます。

## 📈 今後の拡張予定

- [ ] 返信タイミング制御
- [ ] 誤字・訂正演出
- [ ] 複数キャラクター対応
- [ ] 音声メッセージ対応
- [ ] 課金システム

## 📄 ライセンス

MIT License

---

**注意**: このプロジェクトは教育・研究目的で作成されています。商用利用する場合は適切なライセンスと利用規約を確認してください。