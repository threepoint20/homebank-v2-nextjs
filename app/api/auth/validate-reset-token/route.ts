import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PasswordResetToken } from '@/lib/types';

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: '缺少 token' },
        { status: 400 }
      );
    }

    // 從資料庫查詢 token（帶重試機制處理 Vercel Blob 的最終一致性）
    let tokenData: PasswordResetToken | null = null;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const allTokens = await db.read<PasswordResetToken>('password-reset-tokens.json');
      tokenData = allTokens.find((t) => t.token === token) || null;

      if (tokenData) break;

      if (attempt < maxRetries) {
        await delay(attempt * 500);
      }
    }

    if (!tokenData) {
      return NextResponse.json({ valid: false, message: '無效的重設連結' });
    }

    if (tokenData.used) {
      return NextResponse.json({ valid: false, message: '此重設連結已被使用' });
    }

    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json({ valid: false, message: '重設連結已過期，請重新申請' });
    }

    return NextResponse.json({ valid: true, message: 'Token 有效' });
  } catch (error) {
    console.error('驗證 token 失敗:', error);
    return NextResponse.json(
      { valid: false, message: '驗證失敗' },
      { status: 500 }
    );
  }
}
