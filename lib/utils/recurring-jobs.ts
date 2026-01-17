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
 * 為週期性工作生成所有需要的重複項目
 * 從現在開始到結束日期（或未來 30 天）
 */
export function generateAllRecurringJobs(job: Job, existingJobs: Job[]): Job[] {
  if (!job.isRecurring || !job.dueDate || !job.recurringPattern) {
    return [];
  }
  
  const newJobs: Job[] = [];
  const now = new Date();
  
  // 取得原始截止時間（只取時間部分）
  const originalDueDate = new Date(job.dueDate);
  const dueHour = originalDueDate.getHours();
  const dueMinute = originalDueDate.getMinutes();
  
  // 如果沒有設定結束日期，預設生成未來 30 天
  let endDate: Date;
  if (job.recurringEndDate) {
    endDate = new Date(job.recurringEndDate);
  } else {
    endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);
  }
  
  console.log(`📅 生成週期性工作: ${job.title}`);
  console.log(`   開始: ${now.toISOString()}`);
  console.log(`   結束: ${endDate.toISOString()}`);
  console.log(`   模式: ${job.recurringPattern}`);
  
  // 從今天開始生成
  let currentDate = new Date(now);
  currentDate.setHours(dueHour, dueMinute, 0, 0);
  
  // 如果今天的時間已經過了，從明天開始
  if (currentDate <= now) {
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  const maxIterations = 365; // 最多生成 365 個（防止無限迴圈）
  let iterations = 0;
  
  while (currentDate <= endDate && iterations < maxIterations) {
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
    
    if (shouldGenerate) {
      // 檢查是否已存在
      const exists = existingJobs.some(j => 
        (j.id === job.id || j.parentJobId === job.id) &&
        j.dueDate === currentDate.toISOString()
      );
      
      if (!exists) {
        // 格式化日期為 M/D 格式
        const month = currentDate.getMonth() + 1;
        const day = currentDate.getDate();
        const dateStr = `${month}/${day}`;
        
        const newJob: Job = {
          ...job,
          id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
          title: `${job.title}(${dateStr})`, // 在標題後加上日期
          dueDate: currentDate.toISOString(),
          status: job.assignedTo ? 'in_progress' : 'pending',
          createdAt: new Date().toISOString(),
          assignedAt: job.assignedTo ? new Date().toISOString() : undefined,
          completedAt: undefined,
          approvedAt: undefined,
          actualPoints: undefined,
          discount: undefined,
          parentJobId: job.id,
          // 移除週期性標記，因為這是生成的項目
          isRecurring: false,
          recurringPattern: undefined,
          recurringDays: undefined,
          recurringEndDate: undefined,
        };
        
        newJobs.push(newJob);
        console.log(`   ✅ 生成: ${currentDate.toLocaleDateString('zh-TW')} ${dueHour}:${dueMinute.toString().padStart(2, '0')}`);
      }
    }
    
    // 移到下一天
    currentDate = new Date(currentDate);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`   📊 總共生成 ${newJobs.length} 個工作`);
  
  return newJobs;
}
