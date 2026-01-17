import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { User, PasswordResetToken } from '@/lib/types';

// 生成隨機 token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: '請提供 Email' },
        { status: 400 }
      );
    }

    // 檢查用戶是否存在
    const user = await db.findOne<User>('users.json', (u) => u.email === email);

    // 為了安全性，即使用戶不存在也返回成功訊息（避免洩漏用戶資訊）
    if (!user) {
      return NextResponse.json({
        success: true,
        message: '如果該 Email 存在，重設連結已發送',
      });
    }

    // 生成重設 token
    const token = generateToken();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 小時後過期

    // 儲存 token 到資料庫
    const resetToken: PasswordResetToken = {
      id: Date.now().toString(),
      userId: user.id,
      email: user.email,
      token,
      expiresAt,
      createdAt: new Date().toISOString(),
      used: false,
    };
    
    console.log('🔑 生成重設 token:', {
      tokenId: resetToken.id,
      userId: resetToken.userId,
      email: resetToken.email,
      tokenPreview: token.substring(0, 10) + '...',
      expiresAt: new Date(expiresAt).toISOString(),
    });
    
    // 確保檔案存在（讀取會自動初始化為空陣列）
    const existingTokens = await db.read<PasswordResetToken>('password-reset-tokens.json');
    console.log('📋 現有 tokens 數量:', existingTokens.length);
    
    await db.create('password-reset-tokens.json', resetToken);
    
    console.log('✅ Token 已儲存到資料庫');
    
    // 驗證儲存
    const savedToken = await db.findOne<PasswordResetToken>(
      'password-reset-tokens.json',
      (t) => t.token === token
    );
    console.log('🔍 驗證儲存:', savedToken ? '成功' : '失敗');

    // 建立重設連結
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (request.headers.get('host') 
                      ? `${request.headers.get('x-forwarded-proto') || 'http'}://${request.headers.get('host')}`
                      : 'http://localhost:3000');

    // 發送郵件
    try {
      await sendResetEmail(user.email, user.name, baseUrl, token);
      
      // 郵件發送成功
      return NextResponse.json({
        success: true,
        message: '重設連結已發送至您的 Email',
      });
    } catch (emailError) {
      console.error('發送郵件失敗:', emailError);
      
      // 任何錯誤都返回測試模式（包含 API Key 未設定、測試網域限制等）
      return NextResponse.json({
        success: true,
        message: '重設連結已生成（測試模式）',
        resetUrl: `${baseUrl}/reset-password?token=${token}`,
        testMode: true,
      });
    }
  } catch (error) {
    console.error('忘記密碼處理失敗:', error);
    return NextResponse.json(
      { success: false, message: '處理失敗，請稍後再試' },
      { status: 500 }
    );
  }
}

// 發送重設密碼郵件
async function sendResetEmail(email: string, name: string, baseUrl: string, token: string): Promise<string> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  const resendApiKey = process.env.RESEND_API_KEY;

  // 如果沒有設定 API Key，直接返回連結（測試模式）
  if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY 未設定，使用測試模式');
    console.log('📧 重設密碼連結（測試模式）:', resetUrl);
    throw new Error('Testing mode: No API key configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'HomeBank <onboarding@resend.dev>',
      to: email,
      subject: '重設您的 HomeBank 密碼',
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
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏦 HomeBank V2</h1>
              </div>
              <div class="content">
                <h2>您好，${name}</h2>
                <p>我們收到了重設您密碼的請求。</p>
                <p>請點擊下方按鈕重設您的密碼：</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">重設密碼</a>
                </div>
                <p>或複製以下連結至瀏覽器：</p>
                <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all;">
                  ${resetUrl}
                </p>
                <p><strong>此連結將在 1 小時後失效。</strong></p>
                <p>如果您沒有申請重設密碼，請忽略此郵件。</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} HomeBank V2. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  
  return resetUrl;
}
