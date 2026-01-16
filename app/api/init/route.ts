import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 初始化資料庫 API
export async function POST() {
  try {
    // 檢查是否使用 KV
    const useKV = process.env.KV_REST_API_URL !== undefined;
    
    if (useKV) {
      // 使用 KV 時，呼叫初始化方法
      const { kvDB } = await import('@/lib/db/kv-store');
      await kvDB.initialize();
    } else {
      // 使用 JSON 檔案系統時，呼叫 seed
      const { seedDatabase } = await import('@/lib/db/seed');
      await seedDatabase();
    }

    return NextResponse.json({
      success: true,
      message: '資料庫初始化成功',
      storage: useKV ? 'Vercel KV' : 'JSON Files',
    });
  } catch (error) {
    console.error('初始化失敗:', error);
    return NextResponse.json(
      { success: false, error: '初始化失敗' },
      { status: 500 }
    );
  }
}

// 檢查資料庫狀態
export async function GET() {
  try {
    const useKV = process.env.KV_REST_API_URL !== undefined;
    const users = await db.read('users.json');
    
    return NextResponse.json({
      storage: useKV ? 'Vercel KV' : 'JSON Files',
      initialized: users.length > 0,
      userCount: users.length,
    });
  } catch (error) {
    console.error('檢查狀態失敗:', error);
    return NextResponse.json(
      { error: '檢查狀態失敗' },
      { status: 500 }
    );
  }
}
