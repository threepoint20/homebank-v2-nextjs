# HomeBank V2 測試指南

## 本地測試步驟

### 1. 啟動開發伺服器
```bash
npm run dev
```
訪問：http://localhost:3000

### 2. 初始化資料庫
```bash
curl -X POST http://localhost:3000/api/init
```

### 3. 測試父母帳戶功能

#### 登入
- 訪問：http://localhost:3000/login
- Email: `parent@test.com`
- 密碼: `password123`

#### 測試功能
1. **Dashboard** - 查看系統統計
   - 待完成工作數量
   - 可用獎勵數量
   - 家庭成員數量

2. **工作管理** (`/work-management`)
   - 建立新工作
   - 查看所有工作
   - 刪除工作
   - 查看工作狀態統計

3. **獎勵管理** (`/reward-management`)
   - 建立新獎勵
   - 查看所有獎勵
   - 刪除獎勵
   - 查看獎勵統計

4. **帳戶管理** (`/account-management`)
   - 查看所有父母帳戶
   - 查看所有子女帳戶
   - 查看子女點數

### 4. 測試子女帳戶功能

#### 登入
- 訪問：http://localhost:3000/login
- Email: `child@test.com`
- 密碼: `password123`

#### 測試功能
1. **我的工作** (`/my-jobs`)
   - 查看當前點數 (100)
   - 查看可接取的工作
   - 查看統計資訊

## API 測試

### 認證 API
```bash
# 登入
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@test.com","password":"password123"}'

# 註冊
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"測試用戶","role":"child"}'
```

### 工作 API
```bash
# 取得所有工作
curl http://localhost:3000/api/jobs

# 建立工作
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"title":"整理房間","description":"整理自己的房間","points":10,"createdBy":"1"}'

# 更新工作
curl -X PUT http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{"id":"1","status":"completed"}'

# 刪除工作
curl -X DELETE "http://localhost:3000/api/jobs?id=1"
```

### 獎勵 API
```bash
# 取得所有獎勵
curl http://localhost:3000/api/rewards

# 建立獎勵
curl -X POST http://localhost:3000/api/rewards \
  -H "Content-Type: application/json" \
  -d '{"title":"看電影","description":"可以選一部電影","points":50,"stock":10,"createdBy":"1"}'

# 更新獎勵
curl -X PUT http://localhost:3000/api/rewards \
  -H "Content-Type: application/json" \
  -d '{"id":"1","stock":5}'

# 刪除獎勵
curl -X DELETE "http://localhost:3000/api/rewards?id=1"
```

### 用戶 API
```bash
# 取得所有用戶
curl http://localhost:3000/api/users
```

### 資料庫 API
```bash
# 初始化資料庫
curl -X POST http://localhost:3000/api/init

# 檢查資料庫狀態
curl http://localhost:3000/api/init
```

## 功能檢查清單

### 父母功能
- [ ] 登入/登出
- [ ] 查看 Dashboard 統計
- [ ] 建立工作
- [ ] 查看工作列表
- [ ] 刪除工作
- [ ] 建立獎勵
- [ ] 查看獎勵列表
- [ ] 刪除獎勵
- [ ] 查看所有帳戶
- [ ] 查看子女點數

### 子女功能
- [ ] 登入/登出
- [ ] 查看當前點數
- [ ] 查看可接取的工作
- [ ] 接取工作
- [ ] 完成工作並獲得點數
- [ ] 查看進行中的工作
- [ ] 查看已完成的工作
- [ ] 查看交易記錄
- [ ] 查看累計賺取/消費
- [ ] 瀏覽獎勵商店
- [ ] 兌換獎勵
- [ ] 查看獎勵庫存

### 系統功能
- [ ] 資料庫初始化
- [ ] 本地 JSON 檔案儲存
- [ ] API 正常運作
- [ ] 頁面導航正常
- [ ] 權限控制正常

## 已知限制

1. **父母功能未完成**
   - 手動審核已完成的工作（目前自動審核）
   - 手動調整子女點數
   - 編輯工作/獎勵

2. **系統功能**
   - 通知系統
   - 進階搜尋和篩選
   - 資料匯出

## 下一步開發

1. ~~完成子女的工作接取和完成流程~~ ✅
2. ~~實作點數交易系統~~ ✅
3. ~~實作獎勵兌換功能~~ ✅
4. 加入工作手動審核功能
5. 加入編輯功能（工作/獎勵）
6. 優化 UI/UX
7. 加入搜尋和篩選
8. 實作通知系統
9. 加入資料統計圖表

## Vercel 部署測試

部署到 Vercel 後，需要測試：
1. Vercel KV 資料庫連接
2. 資料持久化
3. API 效能
4. 頁面載入速度
5. 環境變數設定

詳細部署步驟請參考 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
