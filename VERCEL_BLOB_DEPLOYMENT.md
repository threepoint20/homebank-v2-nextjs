# Vercel Blob 部署指南

## 為什麼使用 Vercel Blob？

### Vercel Blob vs Vercel KV

| 特性 | Vercel Blob | Vercel KV |
|------|-------------|-----------|
| 用途 | 檔案儲存 | 鍵值對快取 |
| 資料格式 | JSON 檔案 | Redis 資料結構 |
| 讀寫方式 | HTTP 請求 | Redis 命令 |
| 適合場景 | 結構化資料、檔案 | 快取、計數器 |
| 免費額度 | 1 GB | 256 MB |
| 價格 | 較便宜 | 較貴 |

**HomeBank 使用 Blob 的優勢：**
- ✅ 更大的免費儲存空間（1 GB vs 256 MB）
- ✅ 更適合儲存 JSON 資料檔案
- ✅ 更簡單的資料結構
- ✅ 更容易備份和匯出
- ✅ 成本更低

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
```bash
curl -X POST http://localhost:3000/api/init
```

## Vercel 部署步驟

### 1. 推送到 Git
```bash
git add .
git commit -m "切換到 Vercel Blob"
git push
```

### 2. 在 Vercel 建立專案
1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Add New..." → "Project"
3. 匯入你的 Git 儲存庫：`threepoint20/homebank-v2-nextjs`
4. 框架會自動偵測為 Next.js
5. 點擊 "Deploy"

### 3. 建立 Vercel Blob Storage
1. 在專案設定中，點擊 "Storage" 標籤
2. 點擊 "Create Database"
3. 選擇 "Blob"
4. 輸入名稱：`homebank-blob`
5. 點擊 "Create"
6. Vercel 會自動將環境變數加入專案：
   - `BLOB_READ_WRITE_TOKEN`

### 4. 重新部署
1. 前往 "Deployments" 標籤
2. 點擊最新的部署
3. 點擊右上角的 "..." → "Redeploy"
4. 確認重新部署

### 5. 初始化資料庫
部署完成後，訪問：
```
https://your-project.vercel.app/api/init
```
使用 POST 請求初始化資料庫（只需執行一次）

或使用 curl：
```bash
curl -X POST https://your-project.vercel.app/api/init
```

## 環境變數說明

### 自動設定（Vercel Blob）
- `BLOB_READ_WRITE_TOKEN` - Blob 儲存存取 Token（自動設定）

### 本地開發
本地開發時不需要設定環境變數，系統會自動使用 JSON 檔案系統。

## 資料庫切換邏輯

專案會根據環境自動選擇資料庫：
1. **有 `BLOB_READ_WRITE_TOKEN`** → 使用 Vercel Blob（優先）
2. **有 `KV_REST_API_URL`** → 使用 Vercel KV（向後相容）
3. **都沒有** → 使用 JSON 檔案（本地開發）

## 資料結構

### Blob 儲存路徑
```
homebank/
├── users.json
├── jobs.json
├── rewards.json
└── transactions.json
```

### 資料格式
每個檔案都是 JSON 陣列：
```json
[
  {
    "id": "1",
    "name": "...",
    ...
  }
]
```

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
  "storage": "Vercel Blob",
  "initialized": true,
  "userCount": 2
}
```

## 常見問題

### Q: 本地測試時如何使用 Vercel Blob？
A: 安裝 Vercel CLI 並執行：
```bash
npm i -g vercel
vercel link
vercel env pull .env.local
npm run dev
```

### Q: 資料會在每次部署時重置嗎？
A: 不會。Vercel Blob 的資料是持久化的，只有手動呼叫 `/api/init` 才會重新初始化。

### Q: 如何備份資料？
A: 可以透過 API 匯出所有資料：
```bash
curl https://your-project.vercel.app/api/users > users.json
curl https://your-project.vercel.app/api/jobs > jobs.json
curl https://your-project.vercel.app/api/rewards > rewards.json
curl https://your-project.vercel.app/api/points > transactions.json
```

### Q: 如何清空資料庫？
A: 在 Vercel Dashboard 的 Storage 頁面中，可以刪除並重新建立 Blob Storage。

### Q: 免費方案的限制？
A: Vercel Blob 免費方案：
- 1 GB 儲存空間
- 每月 100 GB 頻寬
- 足夠中小型專案使用

### Q: 如何從 KV 遷移到 Blob？
A: 
1. 匯出 KV 資料
2. 建立 Blob Storage
3. 重新部署專案
4. 呼叫 `/api/init` 初始化
5. 如需保留舊資料，可以手動匯入

## 效能比較

### Vercel Blob
- 讀取速度：~100-200ms（首次）
- 寫入速度：~200-300ms
- 適合：中小型應用，資料量 < 100MB

### Vercel KV
- 讀取速度：~10-50ms
- 寫入速度：~20-100ms
- 適合：高頻讀寫，需要快取

### JSON Files（本地）
- 讀取速度：~1-5ms
- 寫入速度：~5-10ms
- 適合：開發測試

## 監控與除錯

在 Vercel Dashboard 中可以查看：
- 部署日誌
- 函數執行日誌
- Blob 儲存使用量
- 錯誤追蹤

## 最佳實踐

### 1. 資料快取
考慮在前端加入快取機制，減少 API 請求：
```typescript
// 使用 SWR 或 React Query
import useSWR from 'swr';

const { data } = useSWR('/api/users', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
});
```

### 2. 批次操作
盡量減少單次操作，使用批次更新：
```typescript
// 不好：多次寫入
await db.create('users.json', user1);
await db.create('users.json', user2);

// 好：一次寫入
const users = await db.read('users.json');
users.push(user1, user2);
await db.write('users.json', users);
```

### 3. 錯誤處理
加入適當的錯誤處理和重試機制：
```typescript
try {
  await db.write('users.json', users);
} catch (error) {
  console.error('寫入失敗:', error);
  // 重試或回退到快取
}
```

## 成本估算

### 免費方案
- 儲存：1 GB
- 頻寬：100 GB/月
- 適合：個人專案、小型家庭使用

### Pro 方案（$20/月）
- 儲存：100 GB
- 頻寬：1 TB/月
- 適合：多家庭、商業使用

### 實際使用估算
- 每個用戶資料：~1 KB
- 100 個用戶：~100 KB
- 1000 個交易記錄：~500 KB
- 總計：< 1 MB（遠低於免費額度）

## 安全性

### 已實作
- ✅ 環境變數保護 Token
- ✅ API 權限驗證
- ✅ 資料存取控制

### 建議改進
- [ ] 加密敏感資料
- [ ] 實作 Rate Limiting
- [ ] 加入資料驗證
- [ ] 定期備份

## 下一步

1. ✅ 部署到 Vercel
2. ✅ 建立 Blob Storage
3. ✅ 初始化資料庫
4. 🎉 開始使用！

## 相關連結

- [Vercel Blob 文件](https://vercel.com/docs/storage/vercel-blob)
- [專案 GitHub](https://github.com/threepoint20/homebank-v2-nextjs)
- [Vercel Dashboard](https://vercel.com/dashboard)
