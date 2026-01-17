import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, PasswordResetToken } from '@/lib/types';
import { PasswordService } from '@/lib/auth/password';

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    console.log('🔐 重設密碼請求:', {
      hasToken: !!token,
      hasPassword: !!password,
      tokenPreview: token?.substring(0, 10) + '...',
    });

    if (!token || !password) {
      console.log('❌ 缺少必要參數');
      return NextResponse.json(
        { success: false, message: '缺少必要參數' },
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

    console.log('🔍 Token 查詢結果:', tokenData ? {
      found: true,
      tokenId: tokenData.id,
      userId: tokenData.userId,
      used: tokenData.used,
      expiresAt: new Date(tokenData.expiresAt).toISOString(),
      isExpired: Date.now() > tokenData.expiresAt,
    } : { found: false });

    if (!tokenData) {
      console.log('❌ Token 不存在');
      return NextResponse.json(
        { success: false, message: '無效的重設連結' },
        { status: 400 }
      );
    }

    // 檢查是否已使用
    if (tokenData.used) {
      console.log('❌ Token 已被使用');
      return NextResponse.json(
        { success: false, message: '此重設連結已被使用' },
        { status: 400 }
      );
    }

    // 檢查是否過期
    if (Date.now() > tokenData.expiresAt) {
      console.log('❌ Token 已過期');
      return NextResponse.json(
        { success: false, message: '重設連結已過期，請重新申請' },
        { status: 400 }
      );
    }

    // 驗證密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    console.log('🔒 密碼驗證:', {
      isValid: passwordValidation.isValid,
      errors: passwordValidation.errors,
      score: passwordValidation.score,
    });
    
    if (!passwordValidation.isValid) {
      console.log('❌ 密碼強度不足');
      return NextResponse.json(
        { success: false, message: passwordValidation.errors?.join(', ') || '密碼不符合要求' },
        { status: 400 }
      );
    }

    // 雜湊新密碼
    console.log('🔐 開始雜湊密碼...');
    const hashedPassword = await PasswordService.hash(password);
    console.log('✅ 密碼雜湊完成');

    // 更新密碼
    console.log('💾 更新用戶密碼...', { userId: tokenData.userId });
    await db.update<User>('users.json', tokenData.userId, { 
      password: hashedPassword 
    });
    console.log('✅ 密碼更新完成');

    // 標記 token 為已使用
    console.log('🔒 標記 token 為已使用...', { tokenId: tokenData.id });
    await db.update<PasswordResetToken>('password-reset-tokens.json', tokenData.id, {
      used: true,
    });
    console.log('✅ Token 已標記為已使用');

    return NextResponse.json({
      success: true,
      message: '密碼重設成功',
    });
  } catch (error) {
    console.error('❌ 重設密碼失敗:', error);
    return NextResponse.json(
      { success: false, message: '重設密碼失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
