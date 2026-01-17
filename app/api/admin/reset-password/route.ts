import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { PasswordService } from '@/lib/auth/password';

// 管理員重設用戶密碼
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, newPassword } = body;

    console.log('🔐 管理員重設密碼:', { userId });

    if (!userId || !newPassword) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 檢查用戶是否存在
    const user = await db.findOne<User>('users.json', (u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    // 驗證新密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: '密碼強度不足',
          errors: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    // 雜湊新密碼
    const hashedPassword = await PasswordService.hash(newPassword);

    // 更新密碼
    await db.update('users.json', userId, { password: hashedPassword });

    console.log('✅ 密碼重設成功:', userId);

    return NextResponse.json({
      success: true,
      message: '密碼重設成功',
    });
  } catch (error: any) {
    console.error('❌ 重設密碼失敗:', error);
    return NextResponse.json(
      { success: false, error: `重設密碼失敗: ${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
