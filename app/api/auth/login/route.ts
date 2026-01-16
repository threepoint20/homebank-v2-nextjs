import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: '請提供 email 和密碼' },
        { status: 400 }
      );
    }

    const user = await authService.login(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, message: '帳號或密碼錯誤' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '登入失敗' },
      { status: 500 }
    );
  }
}
