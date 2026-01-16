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

    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    // 檢查 email 是否已存在
    const existing = await db.findOne<User>('users.json', (u) => u.email === email);
    if (existing) {
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

    await db.create('users.json', newUser);

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('新增用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: '新增用戶失敗' },
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
