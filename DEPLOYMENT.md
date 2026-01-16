# HomeBank V2 - 部署指南

## 🚀 快速部署到 Synology NAS

### 方法 1: Docker Compose (推薦)

1. **上傳專案到 NAS**
   ```bash
   # 在本機壓縮專案
   tar czf homebank-v2-nextjs.tar.gz homebank-v2-nextjs/
   
   # 上傳到 NAS (使用 File Station 或 SCP)
   scp homebank-v2-nextjs.tar.gz admin@your-nas-ip:/volume1/docker/
   ```

2. **SSH 連接到 NAS**
   ```bash
   ssh admin@your-nas-ip
   cd /volume1/docker
   tar xzf homebank-v2-nextjs.tar.gz
   cd homebank-v2-nextjs
   ```

3. **啟動服務**
   ```bash
   sudo docker-compose up -d --build
   ```

4. **訪問應用**
   - 開啟瀏覽器訪問: `http://your-nas-ip:3000`

### 方法 2: Container Manager GUI

1. **上傳專案到 NAS**
   - 使用 File Station 上傳到 `/docker/homebank-v2-nextjs/`

2. **開啟 Container Manager**
   - 專案 → 新增
   - 專案名稱: `homebank`
   - 路徑: `/volume1/docker/homebank-v2-nextjs`
   - 來源: 選擇「上傳 docker-compose.yml」
   - 上傳 `docker-compose.yml` 檔案

3. **建立並啟動**
   - 點擊「下一步」→「建立」
   - 等待 3-5 分鐘建立完成

## 📊 建立時間對比

| 方式 | 建立時間 | 映像檔大小 | 難度 |
|------|---------|-----------|------|
| Flutter Web | 10-15 分鐘 | 1.2GB | 困難 |
| Next.js | 3-5 分鐘 | 200MB | 簡單 |

## 🔧 管理命令

```bash
# 查看狀態
docker-compose ps

# 查看日誌
docker-compose logs -f

# 重啟服務
docker-compose restart

# 停止服務
docker-compose down

# 更新並重啟
docker-compose up -d --build
```

## 🎯 初始化資料庫

首次部署後，訪問以下 URL 初始化資料庫：
```
http://your-nas-ip:3000/api/init
```

或使用 curl:
```bash
curl -X POST http://your-nas-ip:3000/api/init
```

## 📱 測試帳戶

- **父母帳戶**: parent@test.com / password123
- **子女帳戶**: child@test.com / password123

## 🌐 外網訪問設定

參考 Flutter 版本的 `EXTERNAL_ACCESS_COMPLETE_GUIDE.md`，
設定方式完全相同，只需將端口改為 3000。

## 🔒 安全建議

1. **修改預設密碼**: 首次登入後立即修改測試帳戶密碼
2. **設定防火牆**: 只開放必要的端口
3. **定期備份**: 備份 `/app/data` 目錄中的 JSON 檔案
4. **使用 HTTPS**: 透過反向代理設定 SSL 憑證

## 📦 資料備份

```bash
# 備份資料
docker cp homebank-v2:/app/data ./backup-$(date +%Y%m%d)

# 還原資料
docker cp ./backup-20250107/data homebank-v2:/app/
```

## 🎉 完成！

你的 HomeBank V2 已經成功部署！
訪問 `http://your-nas-ip:3000` 開始使用。
