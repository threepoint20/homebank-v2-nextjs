import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 檢查是否使用 Blob
    const useBlob = process.env.BLOB_READ_WRITE_TOKEN !== undefined;
    
    if (!useBlob) {
      return NextResponse.json({
        success: true,
        message: '本地環境不需要初始化',
      });
    }

    // 嘗試讀取檔案
    const tokens = await db.read('password-reset-tokens.json');
    
    if (tokens.length === 0) {
      // 檔案存在但為空，或檔案不存在（read 返回空陣列）
      // 寫入空陣列以確保檔案存在
      await db.write('password-reset-tokens.json', []);
      
      return NextResponse.json({
        success: true,
        message: 'password-reset-tokens.json 已初始化',
        tokensCount: 0,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'password-reset-tokens.json 已存在',
      tokensCount: tokens.length,
    });
  } catch (error) {
    console.error('初始化失敗:', error);
    return NextResponse.json(
      { success: false, message: '初始化失敗', error: String(error) },
      { status: 500 }
    );
  }
}
