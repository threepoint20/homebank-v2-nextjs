import { Job } from '../types';

/**
 * 計算下一次週期性工作的截止日期
 */
export function calculateNextDueDate(
  currentDueDate: Date,
  pattern: 'daily' | 'weekly' | 'monthly',
  recurringDays?: number[]
): Date | null {
  const next = new Date(currentDueDate);
  
  switch (pattern) {
    case 'daily':
      // 每天：加 1 天
      next.setDate(next.getDate() + 1);
      return next;
      
    case 'weekly':
      // 每週：找到下一個符合的星期幾
      if (!recurringDays || recurringDays.length === 0) {
        // 如果沒有指定星期幾，預設每週同一天
        next.setDate(next.getDate() + 7);
        return next;
      }
      
      // 找到下一個符合的星期幾
      const currentDay = next.getDay();
      let daysToAdd = 1;
      let found = false;
      
      // 最多檢查 7 天
      for (let i = 1; i <= 7; i++) {
        const checkDay = (currentDay + i) % 7;
        if (recurringDays.includes(checkDay)) {
          daysToAdd = i;
          found = true;
          break;
        }
      }
      
      if (found) {
        next.setDate(next.getDate() + daysToAdd);
        return next;
      }
      return null;
      
    case 'monthly':
      // 每月：加 1 個月，保持同一天
      next.setMonth(next.getMonth() + 1);
      return next;
      
    default:
      return null;
  }
}

/**
 * 檢查是否需要生成新的週期性工作
 */
export function shouldGenerateRecurringJob(job: Job): boolean {
  // 必須是週期性工作
  if (!job.isRecurring) return false;
  
  // 必須有截止日期
  if (!job.dueDate) return false;
  
  // 檢查是否已過期
  const dueDate = new Date(job.dueDate);
  const now = new Date();
  
  // 如果截止日期還沒到，不需要生成
  if (dueDate > now) return false;
  
  // 如果有結束日期，檢查是否已超過
  if (job.recurringEndDate) {
    const endDate = new Date(job.recurringEndDate);
    if (now > endDate) return false;
  }
  
  return true;
}

/**
 * 生成下一個週期性工作
 */
export function generateNextRecurringJob(job: Job): Job | null {
  if (!job.isRecurring || !job.dueDate || !job.recurringPattern) {
    return null;
  }
  
  const currentDueDate = new Date(job.dueDate);
  const nextDueDate = calculateNextDueDate(
    currentDueDate,
    job.recurringPattern,
    job.recurringDays
  );
  
  if (!nextDueDate) return null;
  
  // 如果有結束日期，檢查下一次是否超過
  if (job.recurringEndDate) {
    const endDate = new Date(job.recurringEndDate);
    if (nextDueDate > endDate) return null;
  }
  
  // 創建新工作
  const newJob: Job = {
    ...job,
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    dueDate: nextDueDate.toISOString(),
    status: job.assignedTo ? 'in_progress' : 'pending',
    createdAt: new Date().toISOString(),
    assignedAt: job.assignedTo ? new Date().toISOString() : undefined,
    completedAt: undefined,
    approvedAt: undefined,
    actualPoints: undefined,
    discount: undefined,
    parentJobId: job.id, // 記錄父工作 ID
  };
  
  return newJob;
}
