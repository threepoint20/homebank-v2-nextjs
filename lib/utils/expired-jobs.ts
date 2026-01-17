import { Job, PointTransaction } from '../types';

/**
 * 檢查工作是否已過期（超過當天）
 */
export function isJobExpired(job: Job): boolean {
  if (!job.dueDate) return false;
  
  const dueDate = new Date(job.dueDate);
  const now = new Date();
  
  // 取得截止日期的日期部分（年月日）
  const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
  const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // 如果今天的日期大於截止日期的日期，就算過期
  const isExpired = nowDateOnly > dueDateOnly;
  
  console.log(`🔍 檢查工作 "${job.title}" 是否過期:`, {
    dueDate: dueDate.toISOString(),
    dueDateOnly: dueDateOnly.toISOString(),
    nowDateOnly: nowDateOnly.toISOString(),
    isExpired
  });
  
  return isExpired;
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
