# HomeBank V2 - Next.js Version

家庭銀行系統 - 使用 Next.js 14 + TypeScript + Tailwind CSS 構建

## 功能特色

- 👨‍👩‍👧‍👦 **多角色系統**: 父母和子女不同權限
- 💼 **工作管理**: 父母創建工作，子女完成賺取點數
- 🎁 **獎勵商店**: 子女用點數兌換獎勵
- 📊 **點數追蹤**: 完整的點數歷史記錄
- 🔒 **權限控制**: 基於角色的訪問控制 (RBAC)

## 技術棧

- **框架**: Next.js 14 (App Router)
- **語言**: TypeScript
- **樣式**: Tailwind CSS
- **資料儲存**: 
  - 本地開發：JSON 檔案系統
  - Vercel 部署：Vercel KV (Redis)
- **權限**: 自訂 RBAC 系統

## 快速開始

### 本地開發

```bash
# 安裝依賴
npm install

# 開發模式
npm run dev

# 初始化資料庫
curl -X POST http://localhost:3000/api/init

# 訪問應用
open http://localhost:3000
```

### 建置生產版本

```bash
# 建立生產版本
npm run build

# 啟動生產服務
npm start
```

## Vercel 部署

詳細部署步驟請參考 [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

快速步驟：
1. 推送程式碼到 Git
2. 在 Vercel 匯入專案
3. 建立 Vercel KV 資料庫
4. 部署完成後訪問 `/api/init` 初始化資料

## Docker 部署（Synology NAS）

```bash
# 使用 Docker Compose
docker-compose up -d

# 或使用 Docker
docker build -t homebank-v2:latest .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data homebank-v2:latest
```

訪問: http://your-nas-ip:3000

## 預設帳戶

- **父母帳戶**: parent@test.com / password123
- **子女帳戶**: child@test.com / password123

## 專案結構

```
homebank-v2-nextjs/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 認證相關頁面
│   ├── (parent)/          # 父母功能頁面
│   ├── (child)/           # 子女功能頁面
│   └── api/               # API Routes
├── components/            # React 組件
├── lib/                   # 工具函數和邏輯
│   ├── db/               # 資料庫層
│   │   ├── index.ts      # 資料庫介面（自動切換）
│   │   ├── kv-store.ts   # Vercel KV 實作
│   │   └── seed.ts       # 初始資料
│   ├── auth/             # 認證邏輯
│   └── types.ts          # TypeScript 型別
├── data/                  # JSON 資料檔案（本地開發）
└── public/                # 靜態資源
```

## API 端點

### 認證
- `POST /api/auth/login` - 登入
- `POST /api/auth/register` - 註冊

### 資料庫
- `POST /api/init` - 初始化資料庫
- `GET /api/init` - 檢查資料庫狀態

## 環境變數

### Vercel KV（自動設定）
```env
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

本地開發不需要設定環境變數。

## 授權

MIT License
