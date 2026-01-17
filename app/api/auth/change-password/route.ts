import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();

    console.log('🔐 收到修改密碼請求:', { userId });

    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '請提供完整資訊' },
        { status: 400 }
      );
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.errors?.join(', ') || '修改密碼失敗',
          errors: result.errors 
        },
        { status: 400 }
      );
    }

    console.log('✅ 密碼修改成功:', userId);

    return NextResponse.json({
      success: true,
      message: '密碼修改成功',
    });
  } catch (error: any) {
    console.error('❌ 修改密碼失敗:', error);
    return NextResponse.json(
      { success: false, message: `修改密碼失敗: ${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}