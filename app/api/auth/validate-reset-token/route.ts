import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PasswordResetToken } from '@/lib/types';

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    console.log('🔍 驗證 token:', token?.substring(0, 10) + '...');

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
      console.log(`🔄 嘗試 ${attempt}/${maxRetries} 讀取 token...`);
      
      // 清除快取以確保讀取最新資料
      const allTokens = await db.read<PasswordResetToken>('password-reset-tokens.json', true);
      console.log(`📋 資料庫中的所有 tokens: ${allTokens.length}`);
      
      tokenData = allTokens.find((t) => t.token === token) || null;
      
      if (tokenData) {
        console.log(`✅ 第 ${attempt} 次嘗試找到 token`);
        break;
      }
      
      // 如果不是最後一次嘗試，等待後重試
      if (attempt < maxRetries) {
        console.log(`⏳ 等待 ${attempt * 500}ms 後重試...`);
        await delay(attempt * 500); // 遞增延遲：500ms, 1000ms
      }
    }

    console.log('📋 查詢結果:', tokenData ? {
      found: true,
      tokenId: tokenData.id,
      used: tokenData.used,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
      isExpired: Date.now() > tokenData.expiresAt,
    } : { found: false });

    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        message: '無效的重設連結',
      });
    }

    // 檢查是否已使用
    if (tokenData.used) {
      return NextResponse.json({
        valid: false,
        message: '此重設連結已被使用',
      });
    }

    // 檢查是否過期
    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json({
        valid: false,
        message: '重設連結已過期，請重新申請',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Token 有效',
    });
  } catch (error) {
    console.error('驗證 token 失敗:', error);
    return NextResponse.json(
      { valid: false, message: '驗證失敗' },
      { status: 500 }
    );
  }
}
