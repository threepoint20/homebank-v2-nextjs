/**
 * 計算工作完成的獎勵折扣
 *
 * 規則：
 * - 準時或提前完成：100% (無折扣)
 * - 逾期 1 小時內：70%
 * - 逾期 1.5 小時內：50%
 * - 逾期 2 小時內：30%
 * - 逾期超過 2 小時：0%
 * - 超過當天（跨日）：扣除該項目獎勵金額（負數）
 */
export function calculateDiscount(dueDate: string | undefined, completedAt: string): {
  discount: number;
  message: string;
} {
  // 如果沒有設定截止日期，則無折扣
  if (!dueDate) {
    return {
      discount: 100,
      message: '無截止日期限制',
    };
  }

  const due = new Date(dueDate);
  const completed = new Date(completedAt);

  // 計算延遲時間（毫秒）
  const delayMs = completed.getTime() - due.getTime();
  const delayHours = delayMs / (1000 * 60 * 60);

  // 檢查是否跨日
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const completedDay = new Date(completed.getFullYear(), completed.getMonth(), completed.getDate());
  const isCrossDay = completedDay.getTime() > dueDay.getTime();

  if (delayHours <= 0) {
    return { discount: 100, message: '✅ 準時完成' };
  } else if (isCrossDay) {
    return { discount: -100, message: '❌ 超過當天，扣除獎勵點數' };
  } else if (delayHours <= 1) {
    return { discount: 70, message: '⚠️ 逾期 1 小時內，獎勵 70%' };
  } else if (delayHours <= 1.5) {
    return { discount: 50, message: '⚠️ 逾期 1.5 小時內，獎勵 50%' };
  } else if (delayHours <= 2) {
    return { discount: 30, message: '⚠️ 逾期 2 小時內，獎勵 30%' };
  } else {
    return { discount: 0, message: '❌ 逾期超過 2 小時，無獎勵' };
  }
}

/**
 * 計算實際獲得的點數
 */
export function calculateActualPoints(originalPoints: number, discount: number): number {
  if (discount === -100) {
    // 跨日扣點
    return -originalPoints;
  }

  return Math.floor(originalPoints * (discount / 100));
}
