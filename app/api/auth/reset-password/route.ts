import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, PasswordResetToken } from '@/lib/types';
import { PasswordService } from '@/lib/auth/password';

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數' },
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

      // 如果不是最後一次嘗試，等待後重試
      if (attempt < maxRetries) {
        await delay(attempt * 500); // 遞增延遲：500ms, 1000ms
      }
    }

    if (!tokenData) {
      return NextResponse.json(
        { success: false, message: '無效的重設連結' },
        { status: 400 }
      );
    }

    // 檢查是否已使用
    if (tokenData.used) {
      return NextResponse.json(
        { success: false, message: '此重設連結已被使用' },
        { status: 400 }
      );
    }

    // 檢查是否過期
    if (Date.now() > tokenData.expiresAt) {
      return NextResponse.json(
        { success: false, message: '重設連結已過期，請重新申請' },
        { status: 400 }
      );
    }

    // 驗證密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.errors?.join(', ') || '密碼不符合要求' },
        { status: 400 }
      );
    }

    // 雜湊新密碼並更新
    const hashedPassword = await PasswordService.hash(password);
    await db.update<User>('users.json', tokenData.userId, {
      password: hashedPassword,
    });

    // 標記 token 為已使用
    await db.update<PasswordResetToken>('password-reset-tokens.json', tokenData.id, {
      used: true,
    });

    return NextResponse.json({
      success: true,
      message: '密碼重設成功',
    });
  } catch (error) {
    console.error('重設密碼失敗:', error);
    return NextResponse.json(
      { success: false, message: '重設密碼失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
