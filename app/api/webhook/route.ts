import { Client } from '@line/bot-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

// LINE Clientの初期化
const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.LINE_CHANNEL_SECRET!
});

// Anthropic Clientの初期化
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// メモリ型定義（一時的なインメモリストレージ用）
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

// 一時的なインメモリストレージ（本来はVercel KVを使用）
const memoryStore = new Map<string, Memory>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // LINEからの署名検証（一時的に無効化）
    const signature = request.headers.get('x-line-signature');
    // 開発用に署名検証を無効化
    // if (!signature) {
    //   return NextResponse.json({ error: 'No signature' }, { status: 400 });
    // }

    for (const event of body.events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleMessage(event);
      } else if (event.type === 'follow') {
        await handleFollow(event);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// 新規フォロー時の処理
async function handleFollow(event: {
  source: { userId: string };
  replyToken: string;
}) {
  const userId = event.source.userId;

  // 初期メモリを作成
  const initialMemory: Memory = {
    conversations: [],
    userInfo: { mentioned: [] },
    stats: {
      firstMessage: Date.now(),
      messageCount: 0,
      affection: 20
    }
  };

  // メモリストアに保存
  memoryStore.set(userId, initialMemory);

  // 挨拶メッセージ
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: 'はじめまして！美咲です😊\n友達になってくれてありがとう！\nよろしくね〜✨'
  });
}

// メッセージ処理
async function handleMessage(event: {
  source: { userId: string };
  replyToken: string;
  message: { text: string };
}) {
  const userId = event.source.userId;
  const userMessage = event.message.text;

  // ユーザーの記憶を取得（インメモリから）
  const memory = memoryStore.get(userId) || {
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
  if (userMessage.match(/俺は|私は|僕は|ぼくは|わたしは|おれは/)) {
    const nameMatch = userMessage.match(/(?:俺は|私は|僕は|ぼくは|わたしは|おれは)(.+?)(?:です|だよ|だ|！|。|$)/);
    if (nameMatch && nameMatch[1]) {
      memory.userInfo.name = nameMatch[1].trim();
    }
  }

  // 重要な話題を記録
  const importantKeywords = ['好き', 'カフェ', '映画', '読書', '学校', '仕事', '趣味', 'ゲーム', '音楽', 'アニメ'];
  for (const keyword of importantKeywords) {
    if (userMessage.includes(keyword)) {
      const mention = userMessage.slice(0, 30);
      if (!memory.userInfo.mentioned.includes(mention)) {
        memory.userInfo.mentioned.push(mention);
        // 最新5件のみ保持
        if (memory.userInfo.mentioned.length > 5) {
          memory.userInfo.mentioned = memory.userInfo.mentioned.slice(-5);
        }
      }
      break;
    }
  }

  memory.stats.messageCount++;

  // AI応答生成（記憶を含む）
  const daysSince = Math.floor((Date.now() - memory.stats.firstMessage) / (1000 * 60 * 60 * 24));

  // 親密度に応じた性格調整
  const intimacyLevel = memory.stats.affection;
  let personalityNote = '';
  if (intimacyLevel <= 30) {
    personalityNote = '敬語中心で、まだ少し距離感がある';
  } else if (intimacyLevel <= 60) {
    personalityNote = 'タメ口も混じり始めて、親しみやすくなる';
  } else {
    personalityNote = '完全にタメ口で、甘えるような口調も使える';
  }

  // Claude APIを完全に無効化して固定返答のみ使用
  const responses = [
    'こんにちは😊元気ですか？',
    'お疲れさまです✨',
    'そうなんですね！',
    'わかります〜😅',
    'ありがとうございます💦',
    'お話聞かせて〜！',
    'へー、面白いね✨',
    'そっか、大変だったね💦'
  ];
  const aiText = responses[Math.floor(Math.random() * responses.length)];

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

  // 親密度を少し上げる（メッセージごとに+1、最大100）
  memory.stats.affection = Math.min(100, memory.stats.affection + 1);

  // 記憶を保存（インメモリに）
  memoryStore.set(userId, memory);

  // LINE返信
  await client.replyMessage(event.replyToken, {
    type: 'text',
    text: aiText
  });
}

// GETリクエスト（ヘルスチェック用）
export async function GET() {
  return NextResponse.json({
    status: 'OK',
    message: 'Misaki LINE Bot is running (In-Memory Mode)',
    memoryUsers: memoryStore.size
  });
}