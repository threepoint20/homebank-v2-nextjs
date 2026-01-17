import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job } from '@/lib/types';
import { shouldGenerateRecurringJob, generateNextRecurringJob } from '@/lib/utils/recurring-jobs';

/**
 * 檢查並生成週期性工作
 * 這個 API 可以被定期呼叫（例如每小時一次）來自動生成新的週期性工作
 */
export async function POST(request: NextRequest) {
  try {
    const jobs = await db.read<Job>('jobs.json');
    const newJobs: Job[] = [];
    
    // 找出所有週期性工作
    const recurringJobs = jobs.filter(job => job.isRecurring);
    
    console.log(`📋 檢查 ${recurringJobs.length} 個週期性工作`);
    
    for (const job of recurringJobs) {
      // 檢查是否需要生成新工作
      if (shouldGenerateRecurringJob(job)) {
        const nextJob = generateNextRecurringJob(job);
        
        if (nextJob) {
          // 檢查是否已經存在相同截止日期的工作（避免重複生成）
          const existingJob = jobs.find(j => 
            j.parentJobId === job.id && 
            j.dueDate === nextJob.dueDate
          );
          
          if (!existingJob) {
            await db.create('jobs.json', nextJob);
            newJobs.push(nextJob);
            console.log(`✅ 生成新的週期性工作: ${nextJob.title} (截止: ${nextJob.dueDate})`);
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `已生成 ${newJobs.length} 個新工作`,
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
