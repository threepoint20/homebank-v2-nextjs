# 🚀 Vercel 部署檢查清單

## ✅ 已完成的準備工作

1. ✅ 已安裝 `@vercel/blob` 套件
2. ✅ 已實作 Blob 資料庫層 (`lib/db/blob-store.ts`)
3. ✅ 已更新資料庫選擇邏輯（優先順序：Blob > KV > JSON）
4. ✅ 已修復註冊功能（加入錯誤處理和驗證）
5. ✅ 所有變更已推送到 GitHub

## 📋 Vercel 部署步驟

### 步驟 1: 連接 GitHub 專案到 Vercel

1. 前往 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Add New..." → "Project"
3. 選擇你的 GitHub 專案：`homebank-v2-nextjs`
4. 點擊 "Import"

### 步驟 2: 配置專案設定

在 Vercel 專案設定頁面：

- **Framework Preset**: Next.js（自動偵測）
- **Root Directory**: `./`（預設）
- **Build Command**: `npm run build`（預設）
- **Output Directory**: `.next`（預設）

**不需要設定任何環境變數**（先部署，稍後加入 Blob Storage）

點擊 "Deploy" 開始第一次部署。

### 步驟 3: 建立 Vercel Blob Storage

第一次部署完成後：

1. 在 Vercel 專案頁面，點擊 "Storage" 標籤
2. 點擊 "Create Database"
3. 選擇 "Blob"
4. 輸入資料庫名稱（例如：`homebank-blob`）
5. 點擊 "Create"

### 步驟 4: 連接 Blob Storage 到專案

1. 建立完成後，Vercel 會顯示連接選項
2. 選擇你的專案 `homebank-v2-nextjs`
3. 點擊 "Connect"
4. Vercel 會自動設定環境變數：
   - `BLOB_READ_WRITE_TOKEN`

### 步驟 5: 重新部署

連接 Blob Storage 後：

1. 前往 "Deployments" 標籤
2. 點擊最新的部署
3. 點擊右上角的 "..." → "Redeploy"
4. 確認重新部署

### 步驟 6: 初始化資料庫

部署完成後：

1. 開啟瀏覽器，前往你的 Vercel 網址
2. 在網址後加上 `/api/init`
   ```
   https://your-project.vercel.app/api/init
   ```
3. 你應該會看到：
   ```json
   {
     "success": true,
     "message": "資料庫初始化成功",
     "storage": "Vercel Blob"
   }
   ```

### 步驟 7: 測試註冊功能

1. 前往註冊頁面：`https://your-project.vercel.app/register`
2. 填寫表單：
   - 姓名：測試用戶
   - Email: test@example.com
   - 密碼：至少 6 個字元
   - 角色：選擇「父母」或「子女」
3. 點擊「註冊」
4. 應該會看到「✅ 註冊成功！即將前往登入頁面」

### 步驟 8: 測試登入

1. 使用剛註冊的帳號登入
2. 確認可以正常進入對應的儀表板

## 🔍 故障排除

### 如果註冊失敗

1. 開啟瀏覽器開發者工具（F12）
2. 查看 Console 標籤的錯誤訊息
3. 查看 Network 標籤的 API 請求回應

### 如果看到「使用本地 JSON 檔案系統」

表示 Blob Storage 環境變數未正確設定：

1. 前往 Vercel 專案 → Settings → Environment Variables
2. 確認 `BLOB_READ_WRITE_TOKEN` 存在
3. 如果不存在，重新連接 Blob Storage
4. 重新部署專案

### 檢查資料庫狀態

訪問：`https://your-project.vercel.app/api/init`（GET 請求）

會顯示：
```json
{
  "storage": "Vercel Blob",
  "initialized": true,
  "userCount": 2
}
```

## 📊 預設測試帳號

初始化後會建立以下測試帳號：

**父母帳號：**
- Email: parent@test.com
- 密碼: password123

**子女帳號：**
- Email: child@test.com
- 密碼: password123

## 🎯 功能檢查清單

部署完成後，測試以下功能：

### 父母功能
- [ ] 登入
- [ ] 查看儀表板（統計資料、子女卡片）
- [ ] 工作管理（新增、編輯、刪除、指派）
- [ ] 獎勵管理（新增、編輯、刪除）
- [ ] 帳號管理（新增子女、上傳照片、刪除）
- [ ] 審核子女完成的工作

### 子女功能
- [ ] 登入
- [ ] 查看我的工作（接受、提交完成）
- [ ] 查看我的點數（交易記錄）
- [ ] 獎勵商店（兌換獎勵）

## 📝 注意事項

1. **Blob Storage 容量**：1GB 免費額度
2. **資料格式**：所有資料以 JSON 格式儲存在 Blob
3. **照片儲存**：使用 Base64 編碼儲存在用戶資料中
4. **檔案大小限制**：照片上傳限制 2MB

## 🔗 相關文件

- [VERCEL_BLOB_DEPLOYMENT.md](./VERCEL_BLOB_DEPLOYMENT.md) - 詳細部署指南
- [FEATURES.md](./FEATURES.md) - 功能說明
- [APPROVAL_WORKFLOW.md](./APPROVAL_WORKFLOW.md) - 工作審核流程
- [ACCOUNT_MANAGEMENT.md](./ACCOUNT_MANAGEMENT.md) - 帳號管理說明

## ✨ 完成！

如果所有步驟都成功，你的 HomeBank V2 應用程式現在已經在 Vercel 上運行，並使用 Blob Storage 儲存資料！
