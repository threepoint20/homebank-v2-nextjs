import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// 初始化資料庫 API
export async function POST() {
  try {
    // 檢查使用哪種資料庫
    const useBlob = process.env.BLOB_READ_WRITE_TOKEN !== undefined;
    const useKV = process.env.KV_REST_API_URL !== undefined;
    
    let storageType = 'JSON Files';
    
    if (useBlob) {
      // 使用 Blob 時，呼叫初始化方法
      const { blobDB } = await import('@/lib/db/blob-store');
      await blobDB.initialize();
      storageType = 'Vercel Blob';
    } else if (useKV) {
      // 使用 KV 時，呼叫初始化方法
      const { kvDB } = await import('@/lib/db/kv-store');
      await kvDB.initialize();
      storageType = 'Vercel KV';
    } else {
      // 使用 JSON 檔案系統時，呼叫 seed
      const { seedDatabase } = await import('@/lib/db/seed');
      await seedDatabase();
      storageType = 'JSON Files';
    }

    return NextResponse.json({
      success: true,
      message: '資料庫初始化成功',
      storage: storageType,
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
    const useBlob = process.env.BLOB_READ_WRITE_TOKEN !== undefined;
    const useKV = process.env.KV_REST_API_URL !== undefined;
    
    let storageType = 'JSON Files';
    if (useBlob) storageType = 'Vercel Blob';
    else if (useKV) storageType = 'Vercel KV';
    
    const users = await db.read('users.json');
    
    return NextResponse.json({
      storage: storageType,
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
