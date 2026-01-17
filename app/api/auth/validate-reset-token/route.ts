import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PasswordResetToken } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: '缺少 token' },
        { status: 400 }
      );
    }

    // 從資料庫查詢 token
    const tokenData = await db.findOne<PasswordResetToken>(
      'password-reset-tokens.json',
      (t) => t.token === token
    );

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
