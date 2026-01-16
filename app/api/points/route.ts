import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PointTransaction } from '@/lib/types';

// 取得所有交易記錄
export async function GET() {
  try {
    const transactions = await db.read<PointTransaction>('transactions.json');
    
    // 按時間排序（最新的在前）
    transactions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error('取得交易記錄失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得交易記錄失敗' },
      { status: 500 }
    );
  }
}
