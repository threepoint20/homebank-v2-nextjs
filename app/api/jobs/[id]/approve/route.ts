import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, User, PointTransaction } from '@/lib/types';

// 父母審核工作
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { parentId } = await request.json();
    const jobId = params.id;

    if (!parentId) {
      return NextResponse.json(
        { success: false, error: '缺少父母 ID' },
        { status: 400 }
      );
    }

    // 檢查是否為父母
    const parent = await db.findOne<User>('users.json', (u) => u.id === parentId);
    if (!parent || parent.role !== 'parent') {
      return NextResponse.json(
        { success: false, error: '無權限審核工作' },
        { status: 403 }
      );
    }

    // 檢查工作
    const job = await db.findOne<Job>('jobs.json', (j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    if (job.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: '工作狀態不正確，只能審核已完成的工作' },
        { status: 400 }
      );
    }

    if (!job.assignedTo) {
      return NextResponse.json(
        { success: false, error: '工作未指派給任何人' },
        { status: 400 }
      );
    }

    // 審核通過，更新工作狀態
    const approvedJob = await db.update<Job>('jobs.json', jobId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
    });

    // 發放點數給子女
    const child = await db.findOne<User>('users.json', (u) => u.id === job.assignedTo);
    if (child) {
      const newPoints = (child.points || 0) + job.points;
      await db.update<User>('users.json', job.assignedTo, { points: newPoints });

      // 記錄交易
      const transaction: PointTransaction = {
        id: Date.now().toString(),
        userId: job.assignedTo,
        amount: job.points,
        type: 'earn',
        description: `完成工作：${job.title}`,
        relatedId: jobId,
        createdAt: new Date().toISOString(),
      };
      await db.create('transactions.json', transaction);
    }

    return NextResponse.json({ 
      success: true, 
      job: approvedJob,
      pointsAwarded: job.points,
      childName: child?.name,
    });
  } catch (error) {
    console.error('審核工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '審核工作失敗' },
      { status: 500 }
    );
  }
}
