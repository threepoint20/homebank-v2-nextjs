import { NextRequest, NextResponse } from 'next/server';

// 取得全域的 resetTokens
declare global {
  var resetTokens: Map<string, { userId: string; email: string; expiresAt: number }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, message: '缺少 token' },
        { status: 400 }
      );
    }

    const resetTokens = globalThis.resetTokens;
    
    if (!resetTokens) {
      return NextResponse.json({
        valid: false,
        message: '系統錯誤：Token 儲存未初始化',
      });
    }

    const tokenData = resetTokens.get(token);

    if (!tokenData) {
      return NextResponse.json({
        valid: false,
        message: '無效的重設連結',
      });
    }

    // 檢查是否過期
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return NextResponse.json({
        valid: false,
        message: '重設連結已過期，請重新申請',
      });
    }

    return NextResponse.json({
      valid: true,
      message: 'Token 有效',
    });
  } catch (error) {
    console.error('驗證 token 失敗:', error);
    return NextResponse.json(
      { valid: false, message: '驗證失敗' },
      { status: 500 }
    );
  }
}
