import { Job } from '../types';

/**
 * 格式化日期為 iCalendar 格式
 * 例如：20260117T180000Z
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * 轉義 iCalendar 文字內容
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * 生成 iCalendar (.ics) 檔案內容
 */
export function generateJobICS(
  job: Job,
  childName: string,
  parentName: string
): string {
  const now = new Date();
  const dueDate = job.dueDate ? new Date(job.dueDate) : null;
  
  // 如果沒有截止日期，使用建立時間作為開始時間
  const startDate = dueDate || now;
  
  // 建立描述內容
  let description = escapeICSText(job.description || '');
  description += `\\n\\n💰 獎勵點數：${job.points} 點`;
  description += `\\n👤 指派者：${parentName}`;
  
  if (dueDate) {
    description += `\\n\\n⏰ 逾期規則：`;
    description += `\\n• 準時完成：100% (${job.points} 點)`;
    description += `\\n• 逾期 1 小時內：70% (${Math.floor(job.points * 0.7)} 點)`;
    description += `\\n• 逾期 1.5 小時內：50% (${Math.floor(job.points * 0.5)} 點)`;
    description += `\\n• 逾期 2 小時內：30% (${Math.floor(job.points * 0.3)} 點)`;
    description += `\\n• 逾期超過 2 小時：0 點`;
    description += `\\n• 超過當天：扣除 ${job.points} 點`;
  }
  
  description += `\\n\\n🔗 查看工作：${process.env.NEXT_PUBLIC_BASE_URL || 'https://homebank-v2-nextjs.vercel.app'}/my-jobs`;
  
  // 建立 iCalendar 內容
  let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HomeBank//Job Notification//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
X-WR-CALNAME:HomeBank 工作
X-WR-TIMEZONE:Asia/Taipei
BEGIN:VEVENT
UID:homebank-job-${job.id}@homebank.app
DTSTAMP:${formatICSDate(now)}
DTSTART:${formatICSDate(startDate)}`;

  // 如果有截止日期，設定結束時間
  if (dueDate) {
    icsContent += `\nDTEND:${formatICSDate(dueDate)}`;
  }

  icsContent += `
SUMMARY:🎯 ${escapeICSText(job.title)}
DESCRIPTION:${description}
LOCATION:HomeBank 家庭銀行
STATUS:CONFIRMED
SEQUENCE:0
TRANSP:OPAQUE
ORGANIZER;CN=${escapeICSText(parentName)}:mailto:noreply@homebank.app
ATTENDEE;CN=${escapeICSText(childName)};RSVP=TRUE:mailto:noreply@homebank.app`;

  // 如果有截止日期，添加提醒
  if (dueDate) {
    // 提醒 1：截止前 1 小時
    icsContent += `
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:⏰ 工作即將到期（1小時後）- ${escapeICSText(job.title)}
END:VALARM`;

    // 提醒 2：截止前 30 分鐘
    icsContent += `
BEGIN:VALARM
TRIGGER:-PT30M
ACTION:DISPLAY
DESCRIPTION:⚠️ 工作即將到期（30分鐘後）- ${escapeICSText(job.title)}
END:VALARM`;

    // 提醒 3：截止前 10 分鐘
    icsContent += `
BEGIN:VALARM
TRIGGER:-PT10M
ACTION:DISPLAY
DESCRIPTION:🚨 工作即將到期（10分鐘後）- ${escapeICSText(job.title)}
END:VALARM`;
  }

  icsContent += `
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * 生成 iCalendar 檔案名稱
 */
export function generateICSFilename(job: Job): string {
  // 移除特殊字元，只保留中文、英文、數字
  const safeName = job.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '-');
  return `HomeBank-${safeName}.ics`;
}
