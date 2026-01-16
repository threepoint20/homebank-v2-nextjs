# GitHub 設定指南

## 已完成步驟 ✅

1. ✅ Git repository 已初始化
2. ✅ 所有檔案已加入並提交
3. ✅ 分支已改名為 `main`

## 接下來的步驟

### 方法 1：使用 GitHub 網頁介面（推薦）

1. **前往 GitHub**
   - 訪問：https://github.com/new
   - 或點擊右上角 "+" → "New repository"

2. **建立 Repository**
   - Repository name: `homebank-v2-nextjs`
   - Description: `HomeBank V2 - Family Banking System with Next.js`
   - 選擇 Public 或 Private
   - **不要**勾選 "Add a README file"
   - **不要**勾選 "Add .gitignore"
   - **不要**選擇 License
   - 點擊 "Create repository"

3. **推送程式碼**
   
   在終端機執行以下指令（GitHub 會顯示這些指令）：
   
   ```bash
   # 如果你的 GitHub 用戶名是 YOUR_USERNAME
   git remote add origin https://github.com/YOUR_USERNAME/homebank-v2-nextjs.git
   git push -u origin main
   ```

   或使用 SSH（如果已設定 SSH key）：
   
   ```bash
   git remote add origin git@github.com:YOUR_USERNAME/homebank-v2-nextjs.git
   git push -u origin main
   ```

### 方法 2：使用 GitHub CLI（如果已安裝）

```bash
# 建立 repository 並推送
gh repo create homebank-v2-nextjs --public --source=. --remote=origin --push

# 或建立私有 repository
gh repo create homebank-v2-nextjs --private --source=. --remote=origin --push
```

## 驗證推送成功

推送完成後，訪問你的 repository：
```
https://github.com/YOUR_USERNAME/homebank-v2-nextjs
```

你應該會看到：
- ✅ 所有檔案和資料夾
- ✅ README.md 顯示專案說明
- ✅ 50 個檔案
- ✅ 最新的 commit 訊息

## 後續更新

當你修改程式碼後，使用以下指令推送更新：

```bash
# 查看修改的檔案
git status

# 加入所有修改
git add .

# 提交修改
git commit -m "描述你的修改"

# 推送到 GitHub
git push
```

## 常用 Git 指令

```bash
# 查看狀態
git status

# 查看提交歷史
git log --oneline

# 查看遠端 repository
git remote -v

# 拉取最新程式碼
git pull

# 建立新分支
git checkout -b feature/new-feature

# 切換分支
git checkout main

# 合併分支
git merge feature/new-feature
```

## 疑難排解

### 如果推送時要求登入

**HTTPS 方式：**
- 使用 GitHub Personal Access Token
- 前往：Settings → Developer settings → Personal access tokens → Tokens (classic)
- 建立新 token，選擇 `repo` 權限
- 使用 token 作為密碼

**SSH 方式：**
- 設定 SSH key：https://docs.github.com/en/authentication/connecting-to-github-with-ssh

### 如果遠端已存在

```bash
# 移除舊的遠端
git remote remove origin

# 加入新的遠端
git remote add origin https://github.com/YOUR_USERNAME/homebank-v2-nextjs.git

# 推送
git push -u origin main
```

## Repository 設定建議

推送成功後，在 GitHub repository 設定：

1. **About 區塊**
   - 加入描述
   - 加入網站連結（Vercel 部署後）
   - 加入 Topics: `nextjs`, `typescript`, `tailwindcss`, `family-banking`, `vercel`

2. **README.md**
   - 已包含完整說明
   - 包含功能列表、安裝步驟、部署指南

3. **Issues**
   - 啟用 Issues 追蹤 bug 和功能請求

4. **Discussions**（選填）
   - 啟用 Discussions 進行討論

## 下一步

1. ✅ 推送程式碼到 GitHub
2. 📦 部署到 Vercel（參考 VERCEL_DEPLOYMENT.md）
3. 🎉 分享你的專案！
