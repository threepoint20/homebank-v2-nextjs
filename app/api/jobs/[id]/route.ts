import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, User } from '@/lib/types';

// 接取工作
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string;
    try {
      const body = await request.json();
      userId = body.userId;
    } catch {
      return NextResponse.json(
        { success: false, error: '無效的請求格式 (Invalid JSON)' },
        { status: 400 }
      );
    }

    const jobId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    // 驗證用戶是否存在及權限
    const user = await db.findOne<User>('users.json', (u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    if (user.role !== 'child') {
      return NextResponse.json(
        { success: false, error: '只有子女帳號可以接取工作' },
        { status: 403 }
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
      assignedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('接取工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '接取工作失敗', details: (error as Error).message },
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
    let userId: string;
    try {
      const body = await request.json();
      userId = body.userId;
    } catch {
      return NextResponse.json(
        { success: false, error: '無效的請求格式 (Invalid JSON)' },
        { status: 400 }
      );
    }
    const jobId = params.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: '缺少用戶 ID' },
        { status: 400 }
      );
    }

    // 驗證用戶是否存在及角色
    const user = await db.findOne<User>('users.json', (u) => u.id === userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '用戶不存在' },
        { status: 404 }
      );
    }

    // 檢查角色（額外的安全層）
    if (user.role !== 'child') {
      return NextResponse.json(
        { success: false, error: '只有子女帳號可以提交工作' },
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
      { success: false, error: '提交工作失敗', details: (error as Error).message },
      { status: 500 }
    );
  }
}
