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
 * 取得本週的開始和結束日期
 */
function getThisWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = 週日, 1 = 週一, ...
  
  // 本週開始（週日 00:00:00）
  const start = new Date(now);
  start.setDate(now.getDate() - dayOfWeek);
  start.setHours(0, 0, 0, 0);
  
  // 本週結束（週六 23:59:59）
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
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
 * 生成下一個週期性工作（只生成本週內的）
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
  
  // 檢查下一次是否在本週內
  const thisWeek = getThisWeekRange();
  if (nextDueDate > thisWeek.end) {
    console.log(`⏭️ 下一次工作 "${job.title}" 在 ${nextDueDate.toISOString()} 不在本週內，跳過`);
    return null;
  }
  
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

/**
 * 為週期性工作生成本週所有需要的工作
 */
export function generateThisWeekRecurringJobs(job: Job, existingJobs: Job[]): Job[] {
  if (!job.isRecurring || !job.dueDate || !job.recurringPattern) {
    return [];
  }
  
  const newJobs: Job[] = [];
  const thisWeek = getThisWeekRange();
  const now = new Date();
  
  console.log(`📅 本週範圍: ${thisWeek.start.toISOString()} ~ ${thisWeek.end.toISOString()}`);
  
  // 根據週期類型生成本週的所有工作
  let currentDate = new Date(job.dueDate);
  
  // 如果原始截止日期在本週之前，從本週開始計算
  if (currentDate < thisWeek.start) {
    currentDate = new Date(thisWeek.start);
    // 調整到正確的時間
    const originalTime = new Date(job.dueDate);
    currentDate.setHours(originalTime.getHours(), originalTime.getMinutes(), 0, 0);
  }
  
  // 生成本週內的所有工作
  const maxIterations = 100; // 防止無限迴圈
  let iterations = 0;
  
  while (currentDate <= thisWeek.end && iterations < maxIterations) {
    iterations++;
    
    // 檢查這個日期是否符合週期規則
    let shouldGenerate = false;
    
    if (job.recurringPattern === 'daily') {
      shouldGenerate = true;
    } else if (job.recurringPattern === 'weekly') {
      const dayOfWeek = currentDate.getDay();
      shouldGenerate = job.recurringDays?.includes(dayOfWeek) || false;
    } else if (job.recurringPattern === 'monthly') {
      const originalDate = new Date(job.dueDate);
      shouldGenerate = currentDate.getDate() === originalDate.getDate();
    }
    
    // 只生成未來的工作（不生成已過期的）
    if (shouldGenerate && currentDate > now) {
      // 檢查是否已存在
      const exists = existingJobs.some(j => 
        (j.id === job.id || j.parentJobId === job.id) &&
        j.dueDate === currentDate.toISOString()
      );
      
      if (!exists) {
        const newJob: Job = {
          ...job,
          id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
          dueDate: currentDate.toISOString(),
          status: job.assignedTo ? 'in_progress' : 'pending',
          createdAt: new Date().toISOString(),
          assignedAt: job.assignedTo ? new Date().toISOString() : undefined,
          completedAt: undefined,
          approvedAt: undefined,
          actualPoints: undefined,
          discount: undefined,
          parentJobId: job.id,
        };
        
        newJobs.push(newJob);
        console.log(`✅ 生成工作: ${newJob.title} (${currentDate.toISOString()})`);
      }
    }
    
    // 移到下一天
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return newJobs;
}
