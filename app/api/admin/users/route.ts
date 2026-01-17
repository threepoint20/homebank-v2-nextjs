import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User } from '@/lib/types';
import { PasswordService } from '@/lib/auth/password';

// 取得所有用戶（包含統計資料）
export async function GET() {
  try {
    const users = await db.read<User>('users.json');
    
    // 移除密碼欄位
    const safeUsers = users.map(({ password, ...user }) => user);
    
    // 統計資料
    const stats = {
      total: users.length,
      admins: users.filter(u => u.role === 'admin').length,
      parents: users.filter(u => u.role === 'parent').length,
      children: users.filter(u => u.role === 'child').length,
    };
    
    return NextResponse.json({ success: true, users: safeUsers, stats });
  } catch (error) {
    console.error('取得用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得用戶失敗' },
      { status: 500 }
    );
  }
}

// 管理員新增用戶（可以新增任何角色）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, avatar } = body;

    console.log('📝 管理員新增用戶:', { email, name, role });

    if (!email || !password || !name || !role) {
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

    // 驗證密碼強度
    const passwordValidation = PasswordService.validatePasswordStrength(password);
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

    // 雜湊密碼
    const hashedPassword = await PasswordService.hash(password);

    const newUser: User = {
      id: Date.now().toString(),
      email,
      password: hashedPassword,
      name,
      role,
      points: role === 'child' ? 0 : undefined,
      avatar: avatar || '',
      createdAt: new Date().toISOString(),
    };

    await db.create('users.json', newUser);
    console.log('✅ 用戶建立成功!');

    const { password: _, ...safeUser } = newUser;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (error: any) {
    console.error('❌ 新增用戶失敗:', error);
    return NextResponse.json(
      { success: false, error: `新增用戶失敗: ${error?.message || '未知錯誤'}` },
      { status: 500 }
    );
  }
}

// 管理員刪除用戶
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

    const user = await db.findOne<User>('users.json', (u) => u.id === id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
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

// 管理員更新用戶
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
