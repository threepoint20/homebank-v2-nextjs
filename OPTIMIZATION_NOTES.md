# 專案最佳化變更記錄

日期：2026-03-01

---

## 1. `lib/utils/expired-jobs.ts`

**問題：**
- `isJobExpired()` 函數在每次呼叫時都以 `console.log` 輸出除錯資訊（含 ISO 字串），高頻率執行時會污染 server log、消耗效能。
- `handleExpiredJob()` 使用已棄用的 `String.prototype.substr()`。

**改動：**
- 移除 `isJobExpired()` 中多餘的 `console.log` 區塊，邏輯改為直接回傳比較結果。
- 將 `Math.random().toString(36).substr(2, 9)` 改為標準的 `substring(2, 11)`，消除棄用 API 警告。

---

## 2. `lib/utils/recurring-jobs.ts`

**問題：**
- `getThisWeekRange()` 函數定義後從未被呼叫（dead code），佔用空間並增加維護困惑。
- `generateAllRecurringJobs()` 在每次生成工作時都以 `console.log` 輸出開始/結束/模式/每筆結果，在大量週期工作時造成 server log 過量輸出。
- 使用已棄用的 `String.prototype.substr()`。
- `switch` 的 `case 'weekly'` 缺少區塊作用域（`const` 在 switch 中易引起 lint 警告）。

**改動：**
- 完整刪除未使用的 `getThisWeekRange()` 函數。
- 移除 `generateAllRecurringJobs()` 中所有 `console.log` 輸出。
- 將 `substr(2, 9)` 改為 `substring(2, 11)`。
- 為 `case 'weekly'` 加上大括號區塊，避免 `const` 跨 case 污染的潛在問題。

---

## 3. `lib/utils/discount.ts`

**問題：**
- `calculateDiscount()` 的回傳型別包含 `actualPoints: number` 與 `originalPoints: number`，但每個分支都只回傳固定的 `0`（附帶 TODO 註解說明要「外部計算」），對呼叫者具有誤導性，容易造成誤用。

**改動：**
- 從回傳型別中移除 `actualPoints` 與 `originalPoints` 兩個恆為 `0` 的欄位，讓函數只回傳真正計算出的 `discount` 與 `message`。
- 簡化各分支寫法為單行 `return`，提升可讀性。
- `calculateActualPoints()` 維持不變，由呼叫端（如 `approve/route.ts`）負責計算實際點數，職責更清晰。

---

## 4. `app/api/users/route.ts`

**問題：**
- `POST` handler 中有大量除錯用 `console.log`（含 emoji 圖示），記錄每個步驟（收到請求、檢查 email、驗證密碼、雜湊中、準備建立、建立成功）。這些輸出在正式環境無意義且可能暴露敏感資訊（如 email）。
- 錯誤 handler 重複 `console.error` 兩次（訊息＋詳情），冗餘。

**改動：**
- 移除所有 `POST` 中的 debug `console.log`。
- `catch` 區塊只保留一行 `console.error`，移除重複的詳情輸出。

---

## 5. `app/api/jobs/[id]/route.ts`

**問題：**
- `PUT` handler 在執行 `findOne<User>` 之前，額外呼叫了一次 `db.read('users.json')` 取得所有用戶，僅為了在錯誤訊息中附上可用 ID 列表（`availableUserIds`），導致對 JSON 檔案讀取兩次（一次全讀 + 一次 findOne 又全讀）。
- `POST`/`PUT` handler 散佈大量 `console.log`，包含工作 JSON、用戶 JSON、成功訊息等，與正式環境不符。

**改動：**
- 刪除 `PUT` 中冗餘的 `db.read('users.json')` 呼叫，改為直接使用 `findOne` 查詢，減少一次完整的資料庫讀取。
- 移除所有 debug `console.log`，只保留 `catch` 區塊的 `console.error`。

---

## 6. `lib/auth/password.ts`

**問題：**
- `generateSecurePassword()` 使用 `Math.random()` 作為亂數來源。`Math.random()` 並非密碼學安全（非 CSPRNG），不應用於生成密碼或安全 token。
- 使用 `Array.sort(() => Math.random() - 0.5)` 打亂字串，此方法的隨機性有偏差（非均勻分布），不符合密碼學最佳實踐。

**改動：**
- 引入 Node.js 內建 `crypto` 模組的 `randomInt()`，取代 `Math.random()` 進行字元挑選。
- 改用 Fisher-Yates 洗牌演算法（基於 `randomInt`）取代 `sort(() => Math.random() - 0.5)`，確保打亂分布均勻且密碼學安全。

---

## 7. `lib/db/index.ts`

**問題：**
- `JsonDB.read()` 方法的函數簽章含有 `bustCache?: boolean` 參數，但方法體內完全未使用此參數（可能為早期規劃的快取破除機制，後來未實作）。
- `Database` 介面中同樣宣告了此無用參數，對所有實作類（`JsonDB`、`blobDB`、`kvDB`）的未來維護者造成困惑。

**改動：**
- 從 `JsonDB.read()` 方法簽章移除 `bustCache?: boolean`。
- 從 `Database` 介面的 `read()` 定義移除 `bustCache?: boolean`。

---

## 改動總覽

| 檔案 | 改動類型 |
|------|----------|
| `lib/utils/expired-jobs.ts` | 移除冗餘 console.log、修復棄用 API |
| `lib/utils/recurring-jobs.ts` | 移除死碼、移除冗餘 console.log、修復棄用 API、加強 switch 作用域 |
| `lib/utils/discount.ts` | 修正誤導性回傳型別、簡化程式碼 |
| `app/api/users/route.ts` | 移除 debug console.log |
| `app/api/jobs/[id]/route.ts` | 移除冗餘 DB 讀取、移除 debug console.log |
| `lib/auth/password.ts` | 改用密碼學安全亂數（crypto.randomInt + Fisher-Yates） |
| `lib/db/index.ts` | 移除未使用的 bustCache 參數 |
