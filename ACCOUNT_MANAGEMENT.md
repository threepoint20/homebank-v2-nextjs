# 帳戶管理功能說明

## ✅ 已實作功能

### 1. 新增子女帳戶
父母可以在帳戶管理頁面新增子女帳戶，包含以下功能：

#### 必填欄位
- **姓名**: 子女的姓名
- **Email**: 登入用的 Email（不可重複）
- **密碼**: 至少 6 個字元

#### 選填欄位
- **頭像照片**: 可上傳子女的照片
  - 支援格式：JPG、PNG、GIF 等圖片格式
  - 檔案大小限制：最大 2MB
  - 使用 Base64 編碼儲存

#### 自動設定
- 角色自動設定為「子女」(child)
- 初始點數為 0
- 自動記錄建立時間

### 2. 刪除子女帳戶
- 可以刪除子女帳戶
- 刪除前會顯示確認對話框
- 無法刪除父母帳戶（系統保護）
- 刪除操作無法復原

### 3. 頭像顯示
- 帳戶管理頁面顯示子女頭像
- 子女登入後，所有頁面的 Header 都會顯示頭像
- 如果沒有上傳頭像，顯示姓名首字母

## 使用流程

### 新增子女帳戶
1. 父母登入系統
2. 前往「帳戶管理」頁面
3. 點擊右上角「+ 新增子女帳戶」按鈕
4. 填寫必要資訊：
   - 姓名
   - Email
   - 密碼
5. （選填）上傳頭像照片：
   - 點擊「選擇檔案」按鈕
   - 選擇照片檔案
   - 預覽照片
6. 點擊「新增」按鈕
7. 系統顯示成功訊息
8. 新帳戶出現在子女帳戶列表中

### 刪除子女帳戶
1. 在子女帳戶列表中找到要刪除的帳戶
2. 點擊該帳戶列的「刪除」按鈕
3. 確認刪除對話框中點擊「確定」
4. 系統顯示刪除成功訊息
5. 帳戶從列表中移除

## 頭像功能說明

### 上傳方式
- 使用 HTML5 File API
- 即時預覽功能
- Base64 編碼儲存

### 顯示位置
- 帳戶管理頁面（表格中）
- 子女所有頁面的 Header
  - 我的工作
  - 我的點數
  - 獎勵商店

### 預設顯示
如果沒有上傳頭像：
- 顯示圓形背景
- 顯示姓名的第一個字
- 藍色主題配色

## API 端點

### 新增用戶
```bash
POST /api/users
Content-Type: application/json

{
  "name": "小明",
  "email": "xiaoming@example.com",
  "password": "password123",
  "avatar": "data:image/jpeg;base64,..." // 選填
}
```

### 刪除用戶
```bash
DELETE /api/users?id=USER_ID
```

### 更新用戶（包含頭像）
```bash
PUT /api/users
Content-Type: application/json

{
  "id": "USER_ID",
  "avatar": "data:image/jpeg;base64,..."
}
```

## 資料結構

### User 型別
```typescript
interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'parent' | 'child';
  points?: number;
  avatar?: string;  // Base64 編碼的圖片
  createdAt: string;
}
```

## 安全性考量

### 已實作
- ✅ Email 重複檢查
- ✅ 密碼長度驗證（最少 6 字元）
- ✅ 檔案大小限制（2MB）
- ✅ 檔案類型檢查（僅圖片）
- ✅ 父母帳戶刪除保護
- ✅ 刪除確認對話框

### 建議改進
- [ ] 密碼加密（bcrypt）
- [ ] Email 格式驗證
- [ ] 圖片壓縮（減少儲存空間）
- [ ] 使用雲端儲存（如 Vercel Blob）
- [ ] 更強的密碼要求
- [ ] 防止暴力破解

## 測試範例

### 測試新增帳戶
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試小孩",
    "email": "test@example.com",
    "password": "password123",
    "avatar": ""
  }'
```

### 測試刪除帳戶
```bash
curl -X DELETE "http://localhost:3000/api/users?id=USER_ID"
```

### 測試查詢所有用戶
```bash
curl http://localhost:3000/api/users
```

## 注意事項

1. **頭像儲存方式**
   - 目前使用 Base64 編碼儲存在資料庫中
   - 適合小型專案和測試
   - 生產環境建議使用雲端儲存服務

2. **檔案大小限制**
   - 前端限制 2MB
   - 建議壓縮大圖片後再上傳
   - 可以考慮加入圖片自動壓縮功能

3. **刪除操作**
   - 刪除子女帳戶會永久移除資料
   - 建議加入「停用」功能作為替代方案
   - 可以考慮加入資料備份功能

4. **密碼安全**
   - 目前密碼以明文儲存（僅供測試）
   - 生產環境必須使用加密（bcrypt）
   - 建議加入密碼強度檢查

## 未來改進方向

### 短期
- [ ] 編輯子女資訊（姓名、Email）
- [ ] 更換頭像功能
- [ ] 重設密碼功能
- [ ] 停用/啟用帳戶

### 中期
- [ ] 圖片自動壓縮
- [ ] 使用 Vercel Blob 儲存圖片
- [ ] 密碼加密
- [ ] 批次匯入帳戶

### 長期
- [ ] 帳戶權限細分
- [ ] 家長控制功能
- [ ] 帳戶活動記錄
- [ ] 資料匯出功能
