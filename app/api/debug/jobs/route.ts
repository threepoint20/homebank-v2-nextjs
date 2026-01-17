import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Debug API - 查看工作資料
export async function GET() {
  try {
    const jobs = await db.read('jobs.json');
    
    // 顯示工作資訊
    const safeJobs = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      createdBy: job.createdBy,
      assignedTo: job.assignedTo,
      assignedAt: job.assignedAt,
      completedAt: job.completedAt,
      approvedAt: job.approvedAt,
      points: job.points,
    }));
    
    return NextResponse.json({
      jobCount: jobs.length,
      jobs: safeJobs,
    });
  } catch (error) {
    console.error('Debug 失敗:', error);
    return NextResponse.json(
      { error: 'Debug 失敗', details: (error as Error).message },
      { status: 500 }
    );
  }
}
