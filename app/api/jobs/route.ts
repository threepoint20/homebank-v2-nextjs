import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Job, User } from '@/lib/types';
import { generateJobICS, generateICSFilename } from '@/lib/calendar/icalendar';

// 發送行事曆邀請郵件（使用 Resend）
async function sendCalendarInvite(
  childEmail: string,
  childName: string,
  job: Job,
  parentName: string
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY 未設定，跳過行事曆邀請發送');
    return { success: false, testMode: true };
  }

  // 生成 iCalendar 內容
  const icsContent = generateJobICS(job, childName, parentName);
  const icsFilename = generateICSFilename(job);

  const dueDate = job.dueDate 
    ? new Date(job.dueDate).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '無截止日期';

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'HomeBank <onboarding@resend.dev>',
        to: childEmail,
        subject: `📅 工作行事曆邀請：${job.title}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
                .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .points { font-size: 24px; font-weight: bold; color: #667eea; }
                .deadline { color: #e53e3e; font-weight: bold; }
                .calendar-icon { font-size: 48px; text-align: center; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>📅 HomeBank 行事曆邀請</h1>
                </div>
                <div class="content">
                  <div class="calendar-icon">📆</div>
                  <h2>嗨 ${childName}！</h2>
                  <p>${parentName} 指派了一個新工作給你，並邀請你加入行事曆：</p>
                  
                  <div class="job-card">
                    <h3>🎯 ${job.title}</h3>
                    <p>${job.description}</p>
                    <p><strong>獎勵點數：</strong><span class="points">${job.points} 點</span></p>
                    <p><strong>截止日期：</strong><span class="deadline">${dueDate}</span></p>
                  </div>
                  
                  <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <strong>⏰ 逾期規則：</strong>
                    <ul style="margin: 10px 0; padding-left: 20px;">
                      <li>準時完成：<strong>100%</strong> (${job.points} 點)</li>
                      <li>逾期 1 小時內：<strong>70%</strong> (${Math.floor(job.points * 0.7)} 點)</li>
                      <li>逾期 1.5 小時內：<strong>50%</strong> (${Math.floor(job.points * 0.5)} 點)</li>
                      <li>逾期 2 小時內：<strong>30%</strong> (${Math.floor(job.points * 0.3)} 點)</li>
                      <li>逾期超過 2 小時：<strong>0 點</strong></li>
                      <li style="color: #e53e3e;"><strong>超過當天：扣除 ${job.points} 點</strong></li>
                    </ul>
                  </div>
                  
                  <div style="background: #e6f7ff; padding: 15px; border-radius: 5px; border-left: 4px solid #1890ff;">
                    <h4 style="margin-top: 0;">📱 如何加入行事曆：</h4>
                    <ol style="margin: 10px 0; padding-left: 20px;">
                      <li>點擊郵件附件中的 <strong>${icsFilename}</strong></li>
                      <li>iOS 會自動開啟「行事曆」App</li>
                      <li>點擊「加入」按鈕</li>
                      <li>完成！系統會在截止前 1 小時、30 分鐘、10 分鐘提醒你</li>
                    </ol>
                  </div>
                  
                  <div style="text-align: center; margin-top: 30px;">
                    <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://homebank-v2-nextjs.vercel.app'}/my-jobs" class="button">立即查看工作</a>
                  </div>
                  
                  <p style="margin-top: 20px; color: #666; font-size: 14px; text-align: center;">
                    💡 提示：盡快完成工作可以獲得更多獎勵！
                  </p>
                </div>
              </div>
            </body>
          </html>
        `,
        attachments: [
          {
            filename: icsFilename,
            content: Buffer.from(icsContent).toString('base64'),
            content_type: 'text/calendar; charset=utf-8; method=REQUEST',
          }
        ]
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ 發送行事曆邀請失敗:', error);
      return { success: false, error };
    }

    console.log('✅ 行事曆邀請已發送');
    return { success: true };
  } catch (error) {
    console.error('❌ 發送行事曆邀請失敗:', error);
    return { success: false, error };
  }
}

// 取得所有工作
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');

    let jobs = await db.read<Job>('jobs.json');

    // 篩選
    if (status) {
      jobs = jobs.filter((job) => job.status === status);
    }
    if (assignedTo) {
      jobs = jobs.filter((job) => job.assignedTo === assignedTo);
    }

    return NextResponse.json({ success: true, jobs });
  } catch (error) {
    console.error('取得工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '取得工作失敗' },
      { status: 500 }
    );
  }
}

// 建立新工作
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, points, createdBy, assignedTo, status, dueDate, sendCalendarInvite } = body;

    if (!title || !points || !createdBy) {
      return NextResponse.json(
        { success: false, error: '缺少必要欄位' },
        { status: 400 }
      );
    }

    const newJob: Job = {
      id: Date.now().toString(),
      title,
      description: description || '',
      points: Number(points),
      createdBy,
      status: status || 'pending',
      createdAt: new Date().toISOString(),
      sendCalendarInvite: sendCalendarInvite || false,
    };

    // 如果有截止日期
    if (dueDate) {
      newJob.dueDate = dueDate;
    }

    // 如果有指派給特定子女
    if (assignedTo) {
      newJob.assignedTo = assignedTo;
      newJob.assignedAt = new Date().toISOString();
      newJob.status = 'in_progress';
    }

    await db.create('jobs.json', newJob);

    // 如果需要發送行事曆邀請
    if (sendCalendarInvite && assignedTo && dueDate) {
      console.log('📅 準備發送行事曆邀請...');
      
      // 獲取子女和父母資訊
      const child = await db.findOne<User>('users.json', (u) => u.id === assignedTo);
      const parent = await db.findOne<User>('users.json', (u) => u.id === createdBy);
      
      if (child && parent) {
        const result = await sendCalendarInvite(
          child.email,
          child.name,
          newJob,
          parent.name
        );
        
        if (result.success) {
          console.log('✅ 行事曆邀請發送成功');
        } else if (result.testMode) {
          console.log('⚠️ 測試模式：未發送行事曆邀請');
        } else {
          console.error('❌ 行事曆邀請發送失敗');
        }
      }
    }

    return NextResponse.json({ success: true, job: newJob });
  } catch (error) {
    console.error('建立工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '建立工作失敗' },
      { status: 500 }
    );
  }
}

// 更新工作
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少工作 ID' },
        { status: 400 }
      );
    }

    const updatedJob = await db.update<Job>('jobs.json', id, updates);

    if (!updatedJob) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, job: updatedJob });
  } catch (error) {
    console.error('更新工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '更新工作失敗' },
      { status: 500 }
    );
  }
}

// 刪除工作
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '缺少工作 ID' },
        { status: 400 }
      );
    }

    const deleted = await db.delete('jobs.json', id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: '工作不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('刪除工作失敗:', error);
    return NextResponse.json(
      { success: false, error: '刪除工作失敗' },
      { status: 500 }
    );
  }
}
