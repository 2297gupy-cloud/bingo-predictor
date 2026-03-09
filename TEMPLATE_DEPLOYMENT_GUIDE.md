# 賓果預測器 - 模板部署指南

## 📦 模板包概述

這是一個**完整的共享數據庫模板包**，讓多個用戶可以快速部署應用並共享同一份數據。

### 模板特點

- ✅ **一鍵部署** - 自動化部署腳本，無需複雜配置
- ✅ **共享數據庫** - 所有用戶共享同一個中央數據庫
- ✅ **完整代碼** - 包含 React 前端、Express 後端、數據庫 schema
- ✅ **預配置** - 環境變數和數據庫連接已預配置
- ✅ **開箱即用** - 下載後直接部署，無需修改代碼

---

## 🚀 快速開始（5 分鐘）

### 前置條件

- Node.js 16+ 
- pnpm 或 npm
- Git
- 中央數據庫連接字符串（從原始帳號獲取）

### 部署步驟

#### 方式 1：使用一鍵部署腳本（推薦）

```bash
# 1. 下載並進入模板目錄
git clone https://github.com/2297gupy-cloud/bingo-predictor.git
cd bingo-predictor

# 2. 執行部署腳本
chmod +x deploy.sh
./deploy.sh

# 按照提示輸入中央數據庫連接字符串
```

#### 方式 2：手動部署

```bash
# 1. 克隆代碼
git clone https://github.com/2297gupy-cloud/bingo-predictor.git
cd bingo-predictor

# 2. 安裝依賴
pnpm install

# 3. 設置環境變數
export DATABASE_URL="mysql://user:password@host:3306/database"

# 4. 同步數據庫
pnpm db:push

# 5. 啟動應用
pnpm dev
```

---

## 📋 詳細配置

### 環境變數

| 變數名 | 說明 | 必需 | 來源 |
|--------|------|------|------|
| `DATABASE_URL` | 中央數據庫連接字符串 | ✅ | 原始帳號 |
| `VITE_APP_TITLE` | 應用標題 | ❌ | 自定義或默認 |
| `VITE_APP_LOGO` | 應用 Logo URL | ❌ | 自定義 |
| 其他 OAuth/API 變數 | 自動配置 | ✅ | Manus 平台 |

### 獲取中央數據庫連接字符串

**在原始帳號中：**

1. 進入 Manus Management UI
2. 打開「Database」面板
3. 複製完整的連接字符串

**或者，在終端中：**

```bash
echo $DATABASE_URL
```

### 在新帳號中設置環境變數

**方式 1：在 Manus 中設置（推薦）**

1. 進入新專案的 Management UI
2. 打開「Secrets」面板
3. 添加 `DATABASE_URL` 環境變數
4. 粘貼中央數據庫連接字符串

**方式 2：在終端中設置**

```bash
export DATABASE_URL="mysql://user:password@host:3306/database"
pnpm dev
```

---

## 🔄 數據同步驗證

### 測試共享數據庫

1. **在應用 A 中添加投注**
   - 進行一次投注（例如：5星 x3倍）
   - 記錄投注金額和期數

2. **在應用 B 中查看**
   - 打開應用 B 的結果頁面
   - 應該能看到應用 A 中的投注記錄
   - 驗證金額、倍數、期數都正確

3. **反向測試**
   - 在應用 B 中添加投注
   - 在應用 A 中查看是否同步

### 常見問題排查

#### 無法連接到數據庫

```bash
# 檢查連接字符串
echo $DATABASE_URL

# 測試數據庫連接
mysql -h host -u user -p -D database

# 檢查防火牆和網絡
ping host
```

#### 數據未同步

```bash
# 檢查數據庫 schema
pnpm db:push

# 查看數據庫中的表
mysql -h host -u user -p -D database -e "SHOW TABLES;"
```

#### 應用無法啟動

```bash
# 清除依賴緩存
pnpm store prune
rm -rf node_modules pnpm-lock.yaml

# 重新安裝
pnpm install

# 檢查 Node.js 版本
node --version  # 應該是 16+
```

---

## 📁 模板包結構

```
bingo-predictor/
├── client/                 # React 前端
│   ├── src/
│   │   ├── pages/         # 頁面組件
│   │   ├── components/    # 可重用組件
│   │   └── App.tsx        # 主應用
│   └── public/            # 靜態資源
├── server/                 # Express 後端
│   ├── routers.ts         # API 路由
│   ├── db.ts              # 數據庫查詢
│   └── _core/             # 核心功能
├── drizzle/               # 數據庫 schema
│   ├── schema.ts          # 表定義
│   └── migrations/        # 遷移文件
├── deploy.sh              # 一鍵部署腳本
├── deploy.config.json     # 部署配置
├── SHARED_DATABASE_SETUP.md    # 共享數據庫指南
└── TEMPLATE_DEPLOYMENT_GUIDE.md # 本文件
```

---

## 🔐 安全建議

1. **保護數據庫連接字符串**
   - 不要在公開的地方分享 `DATABASE_URL`
   - 使用 Manus 的環境變數管理功能
   - 定期更改數據庫密碼

2. **用戶認證**
   - 應用使用 Manus OAuth 認證
   - 每個用戶有獨立的會話
   - 數據庫級別的訪問控制

3. **備份和恢復**
   - 定期備份中央數據庫
   - 保存備份副本到安全位置
   - 測試恢復流程

---

## 📊 監控和維護

### 監控應用健康狀態

```bash
# 檢查應用是否運行
curl http://localhost:3000

# 查看應用日誌
pnpm dev  # 開發模式下可以看到實時日誌
```

### 監控數據庫

```bash
# 檢查數據庫連接
mysql -h host -u user -p -D database -e "SELECT 1;"

# 查看表大小
mysql -h host -u user -p -D database -e "
  SELECT table_name, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
  FROM information_schema.tables
  WHERE table_schema = 'database';"

# 查看投注記錄數量
mysql -h host -u user -p -D database -e "SELECT COUNT(*) FROM tickets;"
```

---

## 🆘 獲取幫助

### 文檔

- [共享數據庫設置指南](./SHARED_DATABASE_SETUP.md)
- [GitHub 倉庫](https://github.com/2297gupy-cloud/bingo-predictor)
- [GitHub Issues](https://github.com/2297gupy-cloud/bingo-predictor/issues)

### 常見問題

**Q: 多個應用同時使用會不會衝突？**
A: 不會。只要使用相同的 DATABASE_URL，所有應用都會共享同一份數據，不會有衝突。

**Q: 可以限制用戶只看到自己的投注嗎？**
A: 可以。需要修改應用代碼，在查詢時添加用戶過濾條件。詳見 SHARED_DATABASE_SETUP.md。

**Q: 如何更新應用代碼？**
A: 執行 `git pull origin main` 更新代碼，然後 `pnpm install` 安裝新依賴。

**Q: 如何備份數據？**
A: 使用 `mysqldump` 備份數據庫：
```bash
mysqldump -h host -u user -p database > backup.sql
```

---

## 📝 版本信息

- **模板版本**: 1.0.0
- **應用名稱**: 賓果預測器
- **數據庫類型**: MySQL
- **數據共享**: 中央數據庫
- **最後更新**: 2026-03-09

---

## 📄 許可證

此模板包遵循原始應用的許可證。

---

**準備好了嗎？開始部署吧！** 🚀

```bash
git clone https://github.com/2297gupy-cloud/bingo-predictor.git
cd bingo-predictor
./deploy.sh
```
