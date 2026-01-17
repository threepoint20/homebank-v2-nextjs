import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Debug API - 查看資料庫內容
export async function GET() {
  try {
    const users = await db.read('users.json');
    
    // 不顯示密碼，只顯示其他資訊
    const safeUsers = users.map((user: any) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      parentId: user.parentId,
      passwordLength: user.password?.length || 0,
      passwordPrefix: user.password?.substring(0, 10) || '',
    }));
    
    return NextResponse.json({
      userCount: users.length,
      users: safeUsers,
    });
  } catch (error) {
    console.error('Debug 失敗:', error);
    return NextResponse.json(
      { error: 'Debug 失敗' },
      { status: 500 }
    );
  }
}
