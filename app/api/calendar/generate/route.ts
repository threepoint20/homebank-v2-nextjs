import { NextRequest, NextResponse } from 'next/server';
import { generateJobICS, generateICSFilename } from '@/lib/calendar/icalendar';
import { Job } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { job, childName, parentName } = await request.json();

    if (!job || !childName || !parentName) {
      return NextResponse.json(
        { success: false, error: '缺少必要參數' },
        { status: 400 }
      );
    }

    // 生成 iCalendar 內容
    const icsContent = generateJobICS(job as Job, childName, parentName);
    const filename = generateICSFilename(job as Job);

    // 返回 .ics 檔案
    return new NextResponse(icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error('生成行事曆檔案失敗:', error);
    return NextResponse.json(
      { success: false, error: '生成行事曆檔案失敗' },
      { status: 500 }
    );
  }
}
