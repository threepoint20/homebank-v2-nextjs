import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/auth';
import { UserRole } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, role } = await request.json();

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: '請提供完整資訊' },
        { status: 400 }
      );
    }

    const user = await authService.register(email, password, name, role as UserRole);

    if (!user) {
      return NextResponse.json(
        { success: false, message: '此 email 已被註冊' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: '註冊失敗' },
      { status: 500 }
    );
  }
}
