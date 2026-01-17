import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    console.log('📝 收到註冊請求:', { email, name, role });

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: '請提供完整資訊' },
        { status: 400 }
      );
    }

    const result = await authService.register(email, password, name, role as UserRole);

    if (!result.user) {
      return NextResponse.json(
        { 
          success: false, 
          message: result.errors?.join(', ') || '註冊失敗',
          errors: result.errors 
        },
        { status: 400 }
      );
    }

    console.log('✅ 註冊成功:', result.user.email);

    return NextResponse.json({
      success: true,
      user: result.user,
    });
  } catch (error: any) {
    console.error('❌ 註冊失敗:', error);
    return NextResponse.json(
      { success: false, message: `註冊失敗: ${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}
