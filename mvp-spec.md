# 美咲LINE Bot - MVP要件定義書

## 🎯 MVP目標
**最速でLINE友だち追加だけで動く恋愛チャットボット**

## 🚀 技術スタック（超シンプル）

```yaml
必須:
  - Next.js 14 (Vercel)
  - LINE Messaging API
  - Claude 3 Haiku API

オプション（後で追加）:
  - Vercel KV (データ保存)
  - Vercel Analytics (分析)
```

## 📱 最小機能（Day 1）

### できること（必須）
- LINE友だち追加で即会話開始
- AIによる自然な返答
- 美咲のキャラクター性を維持
- **会話履歴の保存と記憶** ← 必須機能
- **過去の会話を踏まえた返答** ← 必須機能

### できないこと（後回し）
- 複雑な感情パラメータ
- 返信タイミング制御
- 課金機能

## 🏗️ 実装ステップ

### Step 1: 環境構築（10分）
```bash
# プロジェクト作成
npx create-next-app@latest misaki-bot --typescript --app
cd misaki-bot

# 必要パッケージ
npm install @line/bot-sdk @anthropic-ai/sdk @vercel/kv
```

### Step 2: Webhook実装（記憶システム付き）（30分）

```typescript
// app/api/webhook/route.ts
import { Client } from '@line/bot-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { kv } from '@vercel/kv';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// メモリ型定義
interface Memory {
  conversations: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
  userInfo: {
    name?: string;
    mentioned: string[];
  };
  stats: {
    firstMessage: number;
    messageCount: number;
    affection: number;
  };
}

export async function POST(request: Request) {
  const body = await request.json();

  for (const event of body.events) {
    if (event.type === 'message' && event.message.type === 'text') {
      await handleMessage(event);
    }
  }

  return Response.json({ success: true });
}

async function handleMessage(event: any) {
  const userId = event.source.userId;
  const userMessage = event.message.text;

  // ユーザーの記憶を取得
  let memory = await kv.get<Memory>(`user:${userId}`) || {
    conversations: [],
    userInfo: { mentioned: [] },
    stats: {
      firstMessage: Date.now(),
      messageCount: 0,
      affection: 20
    }
  };

  // ユーザーメッセージを保存
  memory.conversations.push({
    role: 'user',
    content: userMessage,
    timestamp: Date.now()
  });

  // 名前の抽出
  if (userMessage.match(/俺は|私は|僕は/)) {
    const nameMatch = userMessage.match(/(?:俺は|私は|僕は)(.+?)(?:です|だよ|！|。|$)/);
    if (nameMatch) memory.userInfo.name = nameMatch[1];
  }

  // 重要な話題を記録
  if (userMessage.includes('好き') || userMessage.includes('カフェ') || userMessage.includes('映画')) {
    memory.userInfo.mentioned.push(userMessage.slice(0, 30));
  }

  memory.stats.messageCount++;

  // AI応答生成（記憶を含む）
  const daysSince = Math.floor((Date.now() - memory.stats.firstMessage) / (1000 * 60 * 60 * 24));

  const aiResponse = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 200,
    messages: [
      // 過去の会話履歴（最新10件）
      ...memory.conversations.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ],
    system: `あなたは17歳の女子高生「美咲」です。

## キャラクター設定
- 性格：控えめ、真面目、たまに天然
- 部活：図書委員
- 趣味：読書、カフェ巡り

## 現在の関係性
${memory.userInfo.name ? `- 相手の名前: ${memory.userInfo.name}` : '- 名前: まだ知らない'}
- 出会ってから: ${daysSince}日目
- メッセージ数: ${memory.stats.messageCount}回
- 親密度: ${memory.stats.affection}/100

## 覚えていること
${memory.userInfo.mentioned.slice(-5).map(m => `- ${m}`).join('\n')}

## 重要なルール
1. 過去の会話を自然に覚えている
2. 以前の話題を参照する（「この前言ってた〜」など）
3. 親密度に応じた話し方（${memory.stats.affection > 50 ? 'タメ口OK' : '敬語中心'}）
4. 短い返信（1-3文）
5. 適度に絵文字を使う`
  });

  const aiText = aiResponse.content[0].text;

  // AI応答を記憶に保存
  memory.conversations.push({
    role: 'assistant',
    content: aiText,
    timestamp: Date.now()
  });

  // 会話履歴は最新20件のみ保持
  if (memory.conversations.length > 20) {
    memory.conversations = memory.conversations.slice(-20);
  }

  // 親密度を少し上げる
  memory.stats.affection = Math.min(100, memory.stats.affection + 1);

  // 記憶を保存（30日間保持）
  await kv.set(`user:${userId}`, memory, { ex: 60 * 60 * 24 * 30 });

  // LINE返信
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: aiText
  });
}
```

### Step 3: デプロイ（5分）

```bash
# Vercelにデプロイ
vercel

# 環境変数設定（Vercelダッシュボード）
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx
ANTHROPIC_API_KEY=xxx
```

### Step 4: LINE設定（5分）

1. LINE Developersでチャネル作成
2. Webhook URL設定: `https://your-app.vercel.app/api/webhook`
3. QRコードで友だち追加
4. **完成！会話開始**

## 📈 段階的改善計画

### Phase 1: 基本会話（1日目）✅
- シンプルなAI応答
- 固定プロンプト

### Phase 2: 記憶追加（2-3日目）
```typescript
// Vercel KV使用
import { kv } from '@vercel/kv';

// 会話履歴保存
await kv.lpush(`history:${userId}`, {
  role: 'user',
  content: userMessage,
  timestamp: Date.now()
});

// 直近10件を取得してコンテキストに
const history = await kv.lrange(`history:${userId}`, 0, 9);
```

### Phase 3: 感情システム（1週間後）
```typescript
// 簡易感情
interface Emotion {
  affection: number;  // 好感度
  mood: number;       // 機嫌
}

// 返信速度変化
const delay = affection > 70 ? 30 : 120; // 秒
setTimeout(() => sendMessage(), delay * 1000);
```

### Phase 4: リアリティ演出（2週間後）
- 既読タイミング
- タイプミス演出
- 時間帯別の話題

## 💰 コスト試算

### MVP運用費（月額）
```yaml
Vercel: 無料枠で十分
Claude Haiku:
  - 1メッセージ約0.01円
  - 1000ユーザー×30メッセージ/日 = 約9,000円/月
LINE: 無料
合計: 約10,000円/月
```

## ✅ MVP成功指標

- **1日目**: 10人が友だち追加して会話
- **3日目**: 継続率50%
- **1週間**: 100人登録、30人が毎日会話
- **1ヶ月**: 有料化の判断材料収集

## 🎮 最初のユーザー体験

1. 友だち追加
2. 美咲から挨拶メッセージ
   ```
   はじめまして！美咲です😊
   友達になってくれてありがとう！
   よろしくね〜
   ```
3. ユーザーが返信
4. 自然な会話が続く

## 🚨 注意事項

### やらないこと
- 複雑な状態管理
- 完璧な会話履歴システム
- 課金機能
- 管理画面

### 集中すること
- **とにかく動くものを作る**
- **ユーザーフィードバック収集**
- **会話の質の改善**

## 📝 必要な準備

1. LINE Developersアカウント
2. Anthropic APIキー（Claude）
3. Vercelアカウント
4. 30分の実装時間

---

**結論**: このMVP仕様なら**今日中に公開可能**。まず動くものを作り、ユーザーの反応を見ながら改善していく。