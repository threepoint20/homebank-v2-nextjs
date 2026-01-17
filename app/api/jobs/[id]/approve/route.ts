import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, User, PointTransaction } from '@/lib/types';
import { calculateDiscount, calculateActualPoints } from '@/lib/utils/discount';

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

    // 計算折扣和實際點數
    const completedAt = job.completedAt || new Date().toISOString();
    const discountInfo = calculateDiscount(job.dueDate, completedAt);
    const actualPoints = calculateActualPoints(job.points, discountInfo.discount);

    console.log('📊 折扣計算:', {
      jobTitle: job.title,
      dueDate: job.dueDate,
      completedAt,
      originalPoints: job.points,
      discount: discountInfo.discount,
      actualPoints,
      message: discountInfo.message,
    });

    // 審核通過，更新工作狀態
    const approvedJob = await db.update<Job>('jobs.json', jobId, {
      status: 'approved',
      approvedAt: new Date().toISOString(),
      actualPoints,
      discount: discountInfo.discount,
    });

    // 發放點數給子女
    const child = await db.findOne<User>('users.json', (u) => u.id === job.assignedTo);
    if (child) {
      const newPoints = (child.points || 0) + actualPoints;
      await db.update<User>('users.json', job.assignedTo, { points: newPoints });

      // 記錄交易
      const transaction: PointTransaction = {
        id: Date.now().toString(),
        userId: job.assignedTo,
        amount: actualPoints,
        type: actualPoints >= 0 ? 'earn' : 'spend',
        description: actualPoints >= 0 
          ? `完成工作：${job.title}${discountInfo.discount !== 100 ? ` (${discountInfo.message})` : ''}`
          : `工作逾期扣點：${job.title} (${discountInfo.message})`,
        relatedId: jobId,
        createdAt: new Date().toISOString(),
      };
      await db.create('transactions.json', transaction);
    }

    return NextResponse.json({ 
      success: true, 
      job: approvedJob,
      pointsAwarded: actualPoints,
      originalPoints: job.points,
      discount: discountInfo.discount,
      discountMessage: discountInfo.message,
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
