# Vercel 部署指南

## 本地測試

### 1. 安裝依賴
```bash
npm install
```

### 2. 本地開發（使用 JSON 檔案系統）
```bash
npm run dev
```

訪問 http://localhost:3000

### 3. 初始化資料庫
訪問 http://localhost:3000/api/init 或執行：
```bash
curl -X POST http://localhost:3000/api/init
```

## Vercel 部署步驟

### 1. 推送到 Git
```bash
git add .
git commit -m "準備部署到 Vercel"
git push
```

### 2. 在 Vercel 建立專案
1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Add New..." → "Project"
3. 匯入你的 Git 儲存庫
4. 框架會自動偵測為 Next.js

### 3. 建立 Vercel KV 資料庫
1. 在專案設定中，點擊 "Storage" 標籤
2. 點擊 "Create Database"
3. 選擇 "KV" (Redis)
4. 選擇區域（建議選擇 Hong Kong 或 Tokyo）
5. 點擊 "Create"
6. Vercel 會自動將環境變數加入專案：
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_REST_API_READ_ONLY_TOKEN`

### 4. 部署專案
點擊 "Deploy" 按鈕，Vercel 會自動：
- 安裝依賴
- 建置專案
- 部署到全球 CDN

### 5. 初始化資料庫
部署完成後，訪問：
```
https://your-project.vercel.app/api/init
```
使用 POST 請求初始化資料庫（只需執行一次）

## 環境變數說明

### 自動設定（Vercel KV）
- `KV_REST_API_URL` - KV 資料庫 REST API URL
- `KV_REST_API_TOKEN` - KV 資料庫存取 Token
- `KV_REST_API_READ_ONLY_TOKEN` - KV 資料庫唯讀 Token

### 本地開發
本地開發時不需要設定環境變數，系統會自動使用 JSON 檔案系統。

## 資料庫切換邏輯

專案會根據環境自動選擇資料庫：
- **有 `KV_REST_API_URL`** → 使用 Vercel KV（生產環境）
- **沒有 `KV_REST_API_URL`** → 使用 JSON 檔案（本地開發）

## 預設帳戶

- **父母帳戶**: parent@test.com / password123
- **子女帳戶**: child@test.com / password123

## 檢查部署狀態

訪問以下 API 檢查資料庫狀態：
```
GET https://your-project.vercel.app/api/init
```

回應範例：
```json
{
  "storage": "Vercel KV",
  "initialized": true,
  "userCount": 2
}
```

## 常見問題

### Q: 本地測試時如何使用 Vercel KV？
A: 安裝 Vercel CLI 並執行：
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npm run dev
```

### Q: 資料會在每次部署時重置嗎？
A: 不會。Vercel KV 的資料是持久化的，只有手動呼叫 `/api/init` 才會重新初始化。

### Q: 如何清空資料庫？
A: 在 Vercel Dashboard 的 Storage 頁面中，可以刪除並重新建立 KV 資料庫。

### Q: 免費方案的限制？
A: Vercel KV 免費方案：
- 256 MB 儲存空間
- 每月 3,000 次請求
- 足夠小型專案使用

## 效能優化建議

1. **使用 Edge Runtime**（可選）
   在 API routes 中加入：
   ```typescript
   export const runtime = 'edge';
   ```

2. **快取策略**
   使用 Next.js 的 `revalidate` 來快取資料

3. **區域選擇**
   選擇離使用者最近的 KV 區域以降低延遲

## 監控與除錯

在 Vercel Dashboard 中可以查看：
- 部署日誌
- 函數執行日誌
- KV 資料庫使用量
- 錯誤追蹤
