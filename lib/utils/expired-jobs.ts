import { Job, PointTransaction } from '../types';

/**
 * 檢查工作是否已過期（超過當天）
 */
export function isJobExpired(job: Job): boolean {
  if (!job.dueDate) return false;
  
  const dueDate = new Date(job.dueDate);
  const now = new Date();
  
  // 取得截止日期的當天結束時間（23:59:59）
  const dueDateEndOfDay = new Date(dueDate);
  dueDateEndOfDay.setHours(23, 59, 59, 999);
  
  // 如果現在時間超過截止日期的當天結束時間，就算過期
  return now > dueDateEndOfDay;
}

/**
 * 處理過期工作
 * 返回需要創建的交易記錄
 */
export function handleExpiredJob(job: Job): {
  updatedJob: Job;
  transaction: PointTransaction | null;
} {
  const now = new Date();
  
  // 更新工作狀態為已完成（但標記為逾期）
  const updatedJob: Job = {
    ...job,
    status: 'approved', // 設為已完成，但實際點數為負數
    approvedAt: now.toISOString(),
    actualPoints: -job.points, // 扣除點數
    discount: -100, // 標記為 -100% 表示逾期扣點
  };
  
  // 如果有指派給子女，創建扣點交易記錄
  let transaction: PointTransaction | null = null;
  if (job.assignedTo) {
    transaction = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      userId: job.assignedTo,
      amount: -job.points, // 負數表示扣點
      type: 'earn', // 仍然是 earn 類型，但金額為負
      description: `工作逾期扣點：${job.title}`,
      relatedId: job.id,
      createdAt: now.toISOString(),
    };
  }
  
  return { updatedJob, transaction };
}

/**
 * 批次處理所有過期工作
 */
export function findExpiredJobs(jobs: Job[]): Job[] {
  return jobs.filter(job => {
    // 只處理進行中的工作
    if (job.status !== 'in_progress') return false;
    
    // 檢查是否已過期
    return isJobExpired(job);
  });
}
