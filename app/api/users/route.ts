import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';

// 取得所有用戶
export async function GET() {
  try {
    const users = await db.read<User>('users.json');
    
    // 移除密碼欄位
    const safeUsers = users.map(({ password, ...user }) => user);
    
    return NextResponse.json({ success: true, users: safeUsers });
  } catch (error) {
    console.error('取得用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得用戶失敗' },
      { status: 500 }
    );
  }
}

// 新增用戶（子女帳戶）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, avatar } = body;

    console.log('📝 收到新增用戶請求:', { email, name, hasAvatar: !!avatar });

    if (!email || !password || !name) {
      console.error('❌ 缺少必要欄位:', { email: !!email, password: !!password, name: !!name });
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 檢查 email 是否已存在
    console.log('🔍 檢查 email 是否已存在...');
    const existing = await db.findOne<User>('users.json', (u) => u.email === email);
    if (existing) {
      console.error('❌ Email 已被使用:', email);
      return NextResponse.json(
        { success: false, error: 'Email 已被使用' },
        { status: 400 }
      );
    }

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password,
      name,
      role: 'child',
      points: 0,
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    };

    console.log('💾 準備建立新用戶:', { id: newUser.id, email: newUser.email });
    await db.create('users.json', newUser);
    console.log('✅ 用戶建立成功!');

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('❌ 新增用戶失敗:', error);
    console.error('錯誤詳情:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return NextResponse.json(
      { success: false, error: `新增用戶失敗: ${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}

// 刪除用戶
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    // 檢查用戶是否存在
    const user = await db.findOne<User>('users.json', (u) => u.id === id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    // 不允許刪除父母帳戶
    if (user.role === 'parent') {
      return NextResponse.json(
        { success: false, error: '無法刪除父母帳戶' },
        { status: 403 }
      );
    }

    const deleted = await db.delete('users.json', id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '刪除失敗' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: '刪除用戶失敗' },
      { status: 500 }
    );
  }
}

// 更新用戶（包含頭像）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    // 不允許更新角色
    if (updates.role) {
      delete updates.role;
    }

    const updatedUser = await db.update<User>('users.json', id, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    const { password: _, ...safeUser } = updatedUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('更新用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新用戶失敗' },
      { status: 500 }
    );
  }
}
