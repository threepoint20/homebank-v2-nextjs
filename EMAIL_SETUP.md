# 郵件服務設定指南

HomeBank V2 使用 [Resend](https://resend.com) 服務來發送忘記密碼的重設郵件。

## 為什麼選擇 Resend？

- ✅ 專為開發者設計，API 簡單易用
- ✅ 與 Vercel 完美整合
- ✅ 免費方案每月 3,000 封郵件
- ✅ 高送達率，不易被標記為垃圾郵件
- ✅ 支援自訂網域

## 設定步驟

### 1. 註冊 Resend 帳號

前往 [https://resend.com](https://resend.com) 註冊帳號。

### 2. 取得 API Key

1. 登入後，前往 [API Keys](https://resend.com/api-keys) 頁面
2. 點擊 "Create API Key"
3. 輸入名稱（例如：HomeBank Production）
4. 選擇權限：**Sending access**
5. 點擊 "Create"
6. 複製產生的 API Key（格式：`re_xxxxxxxxxxxxxxxxxxxxxxxxxx`）

### 3. 設定環境變數

#### 本地開發

在專案根目錄建立 `.env.local` 檔案：

```bash
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# 寄件者 Email（必須是已驗證的網域或使用 Resend 提供的測試網域）
EMAIL_FROM=HomeBank <onboarding@resend.dev>

# 應用程式基礎 URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Vercel 部署

1. 前往 Vercel 專案設定
2. 選擇 "Settings" → "Environment Variables"
3. 新增以下環境變數：
   - `RESEND_API_KEY`: 你的 Resend API Key
   - `EMAIL_FROM`: 寄件者 Email
   - `NEXT_PUBLIC_BASE_URL`: 你的網站 URL（例如：`https://homebank.vercel.app`）

### 4. 驗證網域（選填，用於生產環境）

使用 `onboarding@resend.dev` 只能在測試環境使用。生產環境建議驗證自己的網域：

1. 前往 Resend 的 [Domains](https://resend.com/domains) 頁面
2. 點擊 "Add Domain"
3. 輸入你的網域（例如：`homebank.com`）
4. 按照指示在你的 DNS 設定中新增 TXT、MX、CNAME 記錄
5. 驗證完成後，更新 `EMAIL_FROM` 環境變數：
   ```bash
   EMAIL_FROM=HomeBank <noreply@homebank.com>
   ```

## 測試郵件功能

### 本地測試

如果沒有設定 `RESEND_API_KEY`，系統會在 console 輸出重設連結：

```bash
⚠️ RESEND_API_KEY 未設定，郵件功能將無法使用
📧 重設密碼連結（開發模式）: http://localhost:3000/reset-password?token=...
```

你可以直接複製連結到瀏覽器測試。

### 線上測試

1. 前往忘記密碼頁面：`/forgot-password`
2. 輸入已註冊的 Email
3. 檢查信箱（包含垃圾郵件資料夾）
4. 點擊郵件中的重設連結
5. 輸入新密碼

## 郵件範本

系統會發送以下格式的郵件：

- **主旨**：重設您的 HomeBank 密碼
- **內容**：包含用戶名稱、重設按鈕、連結（1 小時有效期）
- **樣式**：響應式設計，支援深色模式

## 常見問題

### Q: 收不到郵件怎麼辦？

1. 檢查垃圾郵件資料夾
2. 確認 Email 地址正確
3. 檢查 Resend API Key 是否正確設定
4. 查看 Vercel 或本地 console 的錯誤訊息

### Q: 郵件被標記為垃圾郵件？

1. 驗證自己的網域（不要使用 `onboarding@resend.dev`）
2. 設定 SPF、DKIM、DMARC 記錄
3. 避免在郵件中使用過多連結或可疑關鍵字

### Q: 免費方案夠用嗎？

Resend 免費方案提供：
- 每月 3,000 封郵件
- 每日 100 封郵件
- 1 個自訂網域

對於小型家庭應用來說綽綽有餘。

### Q: 可以使用其他郵件服務嗎？

可以！你可以修改 `app/api/auth/forgot-password/route.ts` 中的 `sendResetEmail` 函數，改用：
- SendGrid
- Mailgun
- AWS SES
- Nodemailer + SMTP

## 安全性注意事項

1. **Token 過期時間**：預設 1 小時，可在 `forgot-password/route.ts` 中調整
2. **Token 儲存**：目前使用記憶體儲存，重啟會清空。生產環境建議改用資料庫
3. **防止洩漏**：即使 Email 不存在也返回成功訊息，避免洩漏用戶資訊
4. **密碼強度**：使用 bcrypt 雜湊，最少 6 個字元

## 相關檔案

- `app/(auth)/forgot-password/page.tsx` - 忘記密碼頁面
- `app/(auth)/reset-password/page.tsx` - 重設密碼頁面
- `app/api/auth/forgot-password/route.ts` - 發送重設郵件 API
- `app/api/auth/validate-reset-token/route.ts` - 驗證 token API
- `app/api/auth/reset-password/route.ts` - 重設密碼 API

## 支援

如有問題，請參考：
- [Resend 官方文件](https://resend.com/docs)
- [Resend Next.js 整合指南](https://resend.com/docs/send-with-nextjs)
