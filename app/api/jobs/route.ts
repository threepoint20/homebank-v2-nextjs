import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job } from '@/lib/types';

// 取得所有工作
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    let jobs = await db.read<Job>('jobs.json');

    // 篩選
    if (status) {
      jobs = jobs.filter((job) => job.status === status);
    }
    if (assignedTo) {
      jobs = jobs.filter((job) => job.assignedTo === assignedTo);
    }

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error('取得工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得工作失敗' },
      { status: 500 }
    );
  }
}

// 建立新工作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, points, createdBy, assignedTo, status, dueDate } = body;

    if (!title || !points || !createdBy) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const newJob: Job = {
      id: Date.now().toString(),
      title,
      description: description || '',
      points: Number(points),
      createdBy,
      status: status || 'pending', // 如果有指派，狀態為 in_progress
      createdAt: new Date().toISOString(),
    };

    // 如果有截止日期
    if (dueDate) {
      newJob.dueDate = dueDate;
    }

    // 如果有指派給特定子女
    if (assignedTo) {
      newJob.assignedTo = assignedTo;
      newJob.assignedAt = new Date().toISOString(); // 記錄指派時間
      newJob.status = 'in_progress';
    }

    await db.create('jobs.json', newJob);

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error('建立工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '建立工作失敗' },
      { status: 500 }
    );
  }
}

// 更新工作
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少工作 ID' },
        { status: 400 }
      );
    }

    const updatedJob = await db.update<Job>('jobs.json', id, updates);

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('更新工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新工作失敗' },
      { status: 500 }
    );
  }
}

// 刪除工作
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少工作 ID' },
        { status: 400 }
      );
    }

    const deleted = await db.delete('jobs.json', id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '刪除工作失敗' },
      { status: 500 }
    );
  }
}
