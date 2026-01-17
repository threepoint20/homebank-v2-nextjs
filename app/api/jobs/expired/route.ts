import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, PointTransaction, User } from '@/lib/types';
import { findExpiredJobs, handleExpiredJob } from '@/lib/utils/expired-jobs';

/**
 * 檢查並處理過期工作
 * 自動扣點並標記為逾期
 */
export async function POST(request: NextRequest) {
  try {
    console.log('⏰ 開始檢查過期工作...');
    
    const jobs = await db.read<Job>('jobs.json');
    const users = await db.read<User>('users.json');
    const transactions = await db.read<PointTransaction>('transactions.json');
    
    console.log(`📋 總共有 ${jobs.length} 個工作`);
    
    // 找出所有過期的工作
    const expiredJobs = findExpiredJobs(jobs);
    
    console.log(`⏰ 檢查到 ${expiredJobs.length} 個過期工作`);
    
    if (expiredJobs.length > 0) {
      console.log('過期工作列表:', expiredJobs.map(j => ({
        id: j.id,
        title: j.title,
        dueDate: j.dueDate,
        status: j.status
      })));
    }
    
    const processedJobs: Job[] = [];
    const newTransactions: PointTransaction[] = [];
    
    for (const job of expiredJobs) {
      console.log(`🔄 處理過期工作: ${job.title} (ID: ${job.id})`);
      
      const { updatedJob, transaction } = handleExpiredJob(job);
      
      // 更新工作狀態
      await db.update<Job>('jobs.json', job.id, {
        status: updatedJob.status,
        approvedAt: updatedJob.approvedAt,
        actualPoints: updatedJob.actualPoints,
        discount: updatedJob.discount,
      });
      
      processedJobs.push(updatedJob);
      
      // 如果有交易記錄，扣除子女的點數
      if (transaction && job.assignedTo) {
        // 更新子女點數
        const child = users.find(u => u.id === job.assignedTo);
        if (child) {
          const currentPoints = child.points || 0;
          const newPoints = Math.max(0, currentPoints - job.points); // 不能低於 0
          
          await db.update<User>('users.json', child.id, {
            points: newPoints,
          });
          
          console.log(`💰 扣除 ${child.name} 的點數: ${currentPoints} -> ${newPoints} (-${job.points})`);
        }
        
        // 創建交易記錄
        await db.create('transactions.json', transaction);
        newTransactions.push(transaction);
        
        console.log(`📝 記錄逾期扣點: ${job.title} (-${job.points} 點)`);
      }
    }
    
    console.log(`✅ 完成處理 ${processedJobs.length} 個過期工作`);
    
    return NextResponse.json({
      success: true,
      message: `已處理 ${processedJobs.length} 個過期工作`,
      expiredJobs: processedJobs.length,
      jobs: processedJobs,
      transactions: newTransactions,
    });
  } catch (error) {
    console.error('❌ 處理過期工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '處理過期工作失敗' },
      { status: 500 }
    );
  }
}

/**
 * 手動觸發檢查過期工作
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
