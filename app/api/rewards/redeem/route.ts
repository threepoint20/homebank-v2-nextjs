import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Reward, User, PointTransaction } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, rewardId } = await request.json();

    if (!userId || !rewardId) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 檢查用戶
    const user = await db.findOne<User>('users.json', (u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    // 檢查獎勵
    const reward = await db.findOne<Reward>('rewards.json', (r) => r.id === rewardId);
    if (!reward) {
      return NextResponse.json(
        { success: false, error: '獎勵不存在' },
        { status: 404 }
      );
    }

    // 檢查庫存
    if (reward.stock <= 0) {
      return NextResponse.json(
        { success: false, error: '獎勵已售罄' },
        { status: 400 }
      );
    }

    // 檢查點數
    if ((user.points || 0) < reward.points) {
      return NextResponse.json(
        { success: false, error: '點數不足' },
        { status: 400 }
      );
    }

    // 扣除點數
    const newPoints = (user.points || 0) - reward.points;
    await db.update<User>('users.json', userId, { points: newPoints });

    // 減少庫存
    await db.update<Reward>('rewards.json', rewardId, { 
      stock: reward.stock - 1 
    });

    // 記錄交易
    const transaction: PointTransaction = {
      id: Date.now().toString(),
      userId,
      amount: -reward.points,
      type: 'spend',
      description: `兌換獎勵：${reward.title}`,
      relatedId: rewardId,
      createdAt: new Date().toISOString(),
    };
    await db.create('transactions.json', transaction);

    return NextResponse.json({ 
      success: true, 
      newPoints,
      message: '兌換成功',
    });
  } catch (error) {
    console.error('兌換獎勵失敗:', error);
    return NextResponse.json(
      { success: false, error: '兌換獎勵失敗' },
      { status: 500 }
    );
  }
}
