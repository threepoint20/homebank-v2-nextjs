import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, User, PointTransaction } from '@/lib/types';

// 接取工作
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    const jobId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    // 檢查工作是否存在
    const job = await db.findOne<Job>('jobs.json', (j) => j.id === jobId);
    if (!job) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    // 檢查工作狀態
    if (job.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: '此工作已被接取' },
        { status: 400 }
      );
    }

    // 更新工作狀態
    const updatedJob = await db.update<Job>('jobs.json', jobId, {
      status: 'in_progress',
      assignedTo: userId,
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('接取工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '接取工作失敗' },
      { status: 500 }
    );
  }
}

// 完成工作（子女提交）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await request.json();
    const jobId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
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

    if (job.assignedTo !== userId) {
      return NextResponse.json(
        { success: false, error: '無權限完成此工作' },
        { status: 403 }
      );
    }

    if (job.status !== 'in_progress') {
      return NextResponse.json(
        { success: false, error: '工作狀態不正確' },
        { status: 400 }
      );
    }

    // 更新工作狀態為待審核（completed）
    const updatedJob = await db.update<Job>('jobs.json', jobId, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    return NextResponse.json({ 
      success: true, 
      job: updatedJob,
      message: '已提交完成，等待父母審核',
    });
  } catch (error) {
    console.error('提交工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '提交工作失敗' },
      { status: 500 }
    );
  }
}
