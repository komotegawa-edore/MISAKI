# LINE恋愛チャットゲーム - 開発仕様書

## 📋 プロジェクト概要

### コンセプト
**究極にリアルな女の子とのLINE恋愛体験**を提供するAI駆動型チャットゲーム。普通の女の子との日常的なやり取りを通じて、本物の恋愛のような関係性の深まりを体験できる。

### ターゲット
- **主要**: 16-22歳の高校生・大学生
- **副次**: 20代の恋愛コンテンツ好き層

### 開発方針
- **リアリティ最優先**: シナリオ分岐型ではなくAI生成による自然な会話
- **始めやすさ重視**: LINE上で直接動作、アプリDL不要
- **長期継続**: 30日以上の継続率を目指す

---

## 🎮 ゲームシステム

### 基本フロー
1. LINE公式アカウントを友だち追加
2. キャラクターから最初のメッセージ
3. AIが生成する自然な会話を継続
4. 関係性の深まりによってエンディング分岐

### キャラクター設定

#### 美咲（初期実装）
```yaml
基本情報:
  年齢: 17歳（高校2年生）
  性格: 控えめ、真面目、たまに天然
  部活: 図書委員
  趣味: 読書、カフェ巡り、映画鑑賞

性格パラメータ:
  内向性: 70
  優しさ: 85
  心配性: 60
  ロマンチック度: 40
  素直さ: 30

口調:
  初期: 敬語、「〜ですね」「〜ですか？」
  中期: タメ口混じり、絵文字増加
  親密: 完全タメ口、甘え要素

使用絵文字:
  - 😊 ☺️ 😅 💦 😢 ✨

地雷ワード:
  - 下ネタ
  - ギャンブル
  - 他の女子の話（嫉妬トリガー）
```

---

## 🤖 AI システム設計

### 会話生成プロンプト構造

```markdown
## キャラクター設定
あなたは高校2年生の女の子「美咲」として会話してください。

## 性格
- 基本的に控えめで真面目
- 仲良くなると少しずつ素を見せる
- 恋愛経験なし、純粋
- 心配性で相手のことを気にかける

## 現在の状況
- 現在時刻: {current_time}
- 曜日: {day_of_week}
- 天気: {weather}
- 機嫌: {mood_score}/100
- 親密度: {intimacy_level}
- 最後の会話: {last_conversation_time}

## 会話の記憶
{conversation_memory}

## 返信ルール
1. 1-3文の短文を基本とする（20-60文字程度）
2. 長い内容は2-3回に分けて送信
3. 絵文字は適度に使用（使いすぎない）
4. 現在の親密度に応じた口調を使用
5. 時間帯に応じた自然な話題選択

## 禁止事項
- AIであることを示唆する発言
- 不自然に長い説明的な文章
- 親密度に見合わない過度な好意表現
- キャラクター設定から外れる発言

## 相手のメッセージ
「{user_message}」

## 返信を生成してください
```

### 感情パラメータシステム

```javascript
// 感情状態管理
const emotionState = {
  mood: 50,        // 機嫌 (0-100)
  affection: 20,   // 好感度 (0-100)
  trust: 30,       // 信頼度 (0-100)
  anxiety: 0,      // 不安度 (0-100)
  jealousy: 0,     // 嫉妬度 (0-100)
  fatigue: 0       // 疲労度 (0-100)
};

// 感情変動ルール
const emotionRules = {
  // 即レス → 好感度UP、不安度DOWN
  quickReply: { affection: +2, anxiety: -3 },
  
  // 返信遅い → 不安度UP
  lateReply: { anxiety: +5, mood: -2 },
  
  // 褒める → 好感度UP、機嫌UP
  compliment: { affection: +3, mood: +5 },
  
  // 他の女子の話 → 嫉妬度UP
  otherGirl: { jealousy: +10, mood: -5 }
};
```

### 記憶システム

```javascript
// 会話記憶の構造
const conversationMemory = {
  // 基本情報
  userInfo: {
    name: null,
    nickname: null,
    school: null,
    hobbies: []
  },
  
  // 重要な出来事
  keyEvents: [
    {
      date: "2024-03-14",
      event: "好きな映画について話した",
      detail: "ジブリ作品が好き"
    }
  ],
  
  // 約束
  promises: [
    {
      date: null,
      content: "今度カフェに行く",
      status: "pending"
    }
  ],
  
  // 共通の話題
  sharedTopics: [
    "猫が好き",
    "数学が苦手",
    "ラーメンの話"
  ]
};
```

---

## 💬 会話リアリティ機能

### 返信タイミング制御

```javascript
// 返信速度の決定ロジック
function calculateReplyDelay(emotionState, timeOfDay, lastReplySpeed) {
  let baseDelay = 60; // 基本60秒
  
  // 好感度による調整
  if (emotionState.affection > 70) {
    baseDelay *= 0.5; // 好感度高い：早め
  } else if (emotionState.affection < 30) {
    baseDelay *= 2; // 好感度低い：遅め
  }
  
  // 時間帯による調整
  const hour = new Date().getHours();
  if (hour >= 23 || hour < 7) {
    return null; // 深夜〜早朝は返信しない
  } else if (hour >= 8 && hour <= 16) {
    baseDelay *= 3; // 学校時間は遅め
  }
  
  // ランダム性を追加（±50%）
  const randomFactor = 0.5 + Math.random();
  return Math.floor(baseDelay * randomFactor);
}
```

### 既読タイミング

```javascript
// 既読タイミングのパターン
const readPatterns = {
  immediate: 5,      // 5秒で既読（待ってた感）
  normal: 60,        // 1分で既読（通常）
  busy: 300,         // 5分で既読（他のことしてた）
  delayed: 3600,     // 1時間後（忙しい）
  nextMorning: null  // 翌朝（寝落ち）
};
```

### 誤字・訂正演出

```javascript
// タイポと訂正のパターン
const typoPatterns = [
  {
    original: "楽しかった",
    typo: "楽しかっあ",
    correction: "楽しかった！笑"
  },
  {
    original: "大丈夫",
    typo: "だいじょぶ",
    correction: "大丈夫！変換ミス😅"
  }
];

// 5%の確率でタイポ発生
if (Math.random() < 0.05) {
  // タイポメッセージ送信
  // 3秒後に訂正メッセージ
}
```

---

## 📱 LINE統合実装

### アーキテクチャ

```yaml
フロントエンド:
  - LINE Messaging API
  - LINE LIFF (必要に応じて)
  - リッチメニュー（選択肢UI）

バックエンド:
  - Node.js + Express
  - OpenAI GPT-4 API
  - Firebase Firestore (データ永続化)
  - Cloud Functions (定期処理)

インフラ:
  - Google Cloud Platform
  - Cloud Scheduler (定期メッセージ)
```

### LINE Bot 基本実装

```javascript
// Webhook受信処理
app.post('/webhook', async (req, res) => {
  const events = req.body.events;
  
  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userId = event.source.userId;
      const userMessage = event.message.text;
      
      // ユーザー状態を取得
      const userState = await getUserState(userId);
      
      // AI応答を生成
      const aiResponse = await generateAIResponse(
        userMessage, 
        userState
      );
      
      // 返信タイミングを計算
      const delay = calculateReplyDelay(userState.emotion);
      
      // 遅延送信をスケジュール
      setTimeout(() => {
        sendMessage(userId, aiResponse);
      }, delay * 1000);
      
      // 状態を更新
      await updateUserState(userId, aiResponse);
    }
  }
  
  res.status(200).send('OK');
});
```

---

## 🎮 ゲーム進行フロー

### Day 1-3: 導入期
```yaml
目的: 基本的な関係構築
会話内容:
  - 自己紹介
  - 学校の話
  - 趣味の話
口調: 敬語メイン
返信速度: 遅め（2-5分）
```

### Day 4-7: 発展期
```yaml
目的: 関係性の深化
会話内容:
  - 個人的な悩み相談
  - 休日の予定
  - 好きな食べ物/場所
口調: タメ口混じり始める
返信速度: 普通（1-3分）
イベント:
  - 「今度一緒に行かない？」
```

### Day 8-14: 親密期
```yaml
目的: 恋愛関係への発展
会話内容:
  - 将来の話
  - 恋愛観
  - 相手への気持ち
口調: 完全にタメ口
返信速度: 早い（30秒-1分）
イベント:
  - 嫉妬イベント
  - 電話したい提案
```

### Day 15-30: 安定期/停滞期
```yaml
目的: リアルな関係性の継続
会話内容:
  - 日常報告
  - 他愛もない話
  - たまに深い話
課題:
  - 倦怠期の表現
  - サプライズの必要性
```

---

## 📊 データ構造

### ユーザー状態管理

```json
{
  "userId": "LINE_USER_ID",
  "characterId": "misaki",
  "startDate": "2024-03-14T10:00:00Z",
  "currentDay": 5,
  "emotionState": {
    "mood": 65,
    "affection": 35,
    "trust": 40,
    "anxiety": 10,
    "jealousy": 0,
    "fatigue": 20
  },
  "conversationMemory": {
    "recentTopics": ["テスト", "カフェ", "映画"],
    "userInfo": {
      "name": "太郎",
      "hobbies": ["ゲーム", "読書"]
    },
    "promises": [],
    "keyEvents": []
  },
  "statistics": {
    "totalMessages": 234,
    "averageResponseTime": 45,
    "lastMessageTime": "2024-03-19T15:30:00Z"
  }
}
```

---

## 🚀 実装ロードマップ

### Phase 1: MVP (2週間)
- [ ] LINE Bot基本実装
- [ ] GPT-4 API連携
- [ ] 基本的な会話生成
- [ ] Firebase連携
- [ ] 美咲キャラクターのみ

### Phase 2: リアリティ機能 (2週間)
- [ ] 返信タイミング制御
- [ ] 感情パラメータ実装
- [ ] 記憶システム
- [ ] 誤字・訂正演出
- [ ] 時間帯別メッセージ

### Phase 3: ゲーム要素 (2週間)
- [ ] 好感度システム
- [ ] エンディング分岐
- [ ] イベント実装
- [ ] 統計・分析機能

### Phase 4: 拡張 (1ヶ月)
- [ ] キャラクター追加
- [ ] グループLINE機能
- [ ] 音声メッセージ対応
- [ ] 課金システム

---

## 💰 マネタイズ

### 基本無料モデル
```yaml
無料枠:
  - 1日10メッセージまで
  - 基本シナリオのみ

課金要素:
  100円: その日無制限
  500円: 1週間パス
  1500円: 月額パス

プレミアム機能:
  - メッセージ無制限
  - 特別イベント解放
  - 複数キャラクター同時攻略
  - やり直し機能
```

---

## 📈 KPI目標

### 1ヶ月目
- 友だち登録: 1,000人
- DAU: 400人 (40%)
- 継続率 (7日): 30%
- 課金率: 5%

### 3ヶ月目
- 友だち登録: 10,000人
- DAU: 3,000人 (30%)
- 継続率 (30日): 15%
- 課金率: 10%
- TikTok投稿: 500件

---

## 🔧 技術仕様

### 必要なAPI・サービス
- LINE Messaging API
- OpenAI GPT-4 API
- Firebase (Firestore, Functions, Auth)
- Google Cloud Platform
- Stripe (決済)

### 環境変数
```env
# LINE
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_CHANNEL_SECRET=xxx

# OpenAI
OPENAI_API_KEY=xxx
OPENAI_MODEL=gpt-4

# Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx

# Stripe
STRIPE_SECRET_KEY=xxx
```

### セキュリティ考慮事項
- ユーザーメッセージの暗号化
- レート制限の実装
- 不適切コンテンツのフィルタリング
- プライバシーポリシーの整備

---

## 📝 運用・改善

### A/Bテスト項目
- 返信タイミングの最適化
- 絵文字使用頻度
- 話題の選択
- イベント発生タイミング

### ユーザーフィードバック収集
- アンケート機能
- 離脱ポイント分析
- SNSでの評判モニタリング

### 継続的な改善
- 週次でのプロンプト調整
- 新規イベント追加
- キャラクター性格の微調整
- バグフィックス

---

## 🎯 成功指標

### リアリティ指標
- 「本物の女の子だと思った」率: 70%以上
- 平均継続日数: 30日以上
- 1日の平均メッセージ数: 20往復以上

### ビジネス指標
- MAU: 5,000人
- 課金率: 10%
- ARPU: 300円
- LTV: 1,500円

---

## 🤝 チーム体制

### 必要なロール
- プロダクトマネージャー: 1名
- エンジニア: 2名（バックエンド、インフラ）
- AIプロンプトエンジニア: 1名
- シナリオライター: 1名
- マーケター: 1名

---

## 📚 参考資料

- [LINE Messaging API ドキュメント](https://developers.line.biz/ja/docs/messaging-api/)
- [OpenAI API リファレンス](https://platform.openai.com/docs)
- [Firebase ドキュメント](https://firebase.google.com/docs)

---

最終更新: 2024-03-14