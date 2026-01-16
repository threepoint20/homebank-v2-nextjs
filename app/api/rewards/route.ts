import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Reward } from '@/lib/types';

// 取得所有獎勵
export async function GET() {
  try {
    const rewards = await db.read<Reward>('rewards.json');
    return NextResponse.json({ success: true, rewards });
  } catch (error) {
    console.error('取得獎勵失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得獎勵失敗' },
      { status: 500 }
    );
  }
}

// 建立新獎勵
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, points, stock, createdBy } = body;

    if (!title || !points || stock === undefined || !createdBy) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const newReward: Reward = {
      id: Date.now().toString(),
      title,
      description: description || '',
      points: Number(points),
      stock: Number(stock),
      createdBy,
      createdAt: new Date().toISOString(),
    };

    await db.create('rewards.json', newReward);

    return NextResponse.json({ success: true, reward: newReward });
  } catch (error) {
    console.error('建立獎勵失敗:', error);
    return NextResponse.json(
      { success: false, error: '建立獎勵失敗' },
      { status: 500 }
    );
  }
}

// 更新獎勵
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少獎勵 ID' },
        { status: 400 }
      );
    }

    const updatedReward = await db.update<Reward>('rewards.json', id, updates);

    if (!updatedReward) {
      return NextResponse.json(
        { success: false, error: '獎勵不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, reward: updatedReward });
  } catch (error) {
    console.error('更新獎勵失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新獎勵失敗' },
      { status: 500 }
    );
  }
}

// 刪除獎勵
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少獎勵 ID' },
        { status: 400 }
      );
    }

    const deleted = await db.delete('rewards.json', id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '獎勵不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除獎勵失敗:', error);
    return NextResponse.json(
      { success: false, error: '刪除獎勵失敗' },
      { status: 500 }
    );
  }
}
