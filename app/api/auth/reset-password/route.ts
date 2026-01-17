import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, PasswordResetToken } from '@/lib/types';
import { PasswordService } from '@/lib/auth/password';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 從資料庫查詢 token
    const tokenData = await db.findOne<PasswordResetToken>(
      'password-reset-tokens.json',
      (t) => t.token === token
    );

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
        { success: false, message: passwordValidation.errors?.join(', ') },
        { status: 400 }
      );
    }

    // 雜湊新密碼
    const hashedPassword = await PasswordService.hash(password);

    // 更新密碼
    await db.update<User>('users.json', tokenData.userId, { 
      password: hashedPassword 
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
