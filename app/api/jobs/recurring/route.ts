import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job } from '@/lib/types';
import { generateThisWeekRecurringJobs } from '@/lib/utils/recurring-jobs';

/**
 * 檢查並生成週期性工作（只生成本週內的）
 * 這個 API 可以被定期呼叫來自動生成新的週期性工作
 */
export async function POST(request: NextRequest) {
  try {
    const jobs = await db.read<Job>('jobs.json');
    const newJobs: Job[] = [];
    
    // 找出所有週期性的原始工作（不是從週期性工作生成的）
    const recurringJobs = jobs.filter(job => job.isRecurring && !job.parentJobId);
    
    console.log(`📋 檢查 ${recurringJobs.length} 個週期性工作`);
    
    for (const job of recurringJobs) {
      // 為每個週期性工作生成本週所有需要的工作
      const weekJobs = generateThisWeekRecurringJobs(job, jobs);
      
      for (const newJob of weekJobs) {
        await db.create('jobs.json', newJob);
        newJobs.push(newJob);
        console.log(`✅ 生成新的週期性工作: ${newJob.title} (截止: ${newJob.dueDate})`);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已生成 ${newJobs.length} 個本週工作`,
      newJobs: newJobs.length,
      jobs: newJobs
    });
  } catch (error) {
    console.error('生成週期性工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '生成週期性工作失敗' },
      { status: 500 }
    );
  }
}

/**
 * 手動觸發檢查週期性工作
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
