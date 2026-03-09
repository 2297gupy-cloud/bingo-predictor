# Manus 一鍵部署連結

## 🚀 一鍵部署

用戶只需點擊以下連結，即可在 Manus 中自動建立和部署賓果預測器應用。

### 部署連結

```
https://manus.im/create-project?template=web-db-user&github=2297gupy-cloud/bingo-predictor&name=bingo-predictor
```

### 使用方法

1. **點擊上方連結**
2. **登錄 Manus 帳號**（如果未登錄）
3. **確認建立新專案**
4. **等待自動部署完成**（約 1-2 分鐘）
5. **應用自動啟動**

---

## 📋 部署後的步驟

### 第 1 步：配置數據庫連接

1. 進入新專案的 Management UI
2. 打開「Secrets」面板
3. 添加環境變數：
   - **DATABASE_URL**: 粘貼中央數據庫連接字符串

### 第 2 步：同步數據庫

在 Management UI 中打開「Terminal」，執行：

```bash
pnpm db:push
```

### 第 3 步：啟動應用

應用會自動啟動。如果需要手動啟動：

```bash
pnpm dev
```

---

## 🔗 分享連結

您可以將以下簡化連結分享給用戶：

### 簡短版本

```
https://manus.im/create-project?template=web-db-user&github=2297gupy-cloud/bingo-predictor
```

### 帶說明的版本

> **點擊此連結在 Manus 中一鍵部署賓果預測器：**
> 
> https://manus.im/create-project?template=web-db-user&github=2297gupy-cloud/bingo-predictor&name=bingo-predictor
>
> 部署完成後，只需設置 DATABASE_URL 環境變數，應用即可連接到中央數據庫。

---

## 📱 QR 碼

您也可以生成 QR 碼，讓用戶掃描後直接部署：

```
[QR 碼將顯示上方的部署連結]
```

---

## ✅ 驗證部署成功

部署完成後，用戶應該能看到：

1. ✓ 應用在 Manus 中成功建立
2. ✓ 代碼已從 GitHub 導入
3. ✓ 開發伺服器正在運行
4. ✓ 應用可在瀏覽器中訪問

---

## 🆘 如果部署失敗

### 常見原因

1. **GitHub 連接失敗**
   - 檢查 GitHub 帳號是否已連接到 Manus
   - 重新授權 GitHub

2. **依賴安裝失敗**
   - 在 Management UI 中重新執行 `pnpm install`
   - 清除緩存：`pnpm store prune`

3. **數據庫連接失敗**
   - 檢查 DATABASE_URL 是否正確
   - 確保數據庫伺服器正在運行

### 解決步驟

1. 進入新專案的 Management UI
2. 打開「Terminal」
3. 執行故障排查命令：
   ```bash
   # 檢查 Node.js
   node --version
   
   # 檢查依賴
   pnpm list
   
   # 重新安裝
   pnpm install
   
   # 同步數據庫
   pnpm db:push
   ```

---

## 📚 完整文檔

部署後，用戶可以查看以下文檔：

- **USER_QUICK_START.md** - 快速開始指南
- **TEMPLATE_DEPLOYMENT_GUIDE.md** - 詳細部署指南
- **SHARED_DATABASE_SETUP.md** - 共享數據庫設置

---

## 🎯 推薦用法

### 方式 1：直接分享連結（最簡單）

```
點擊此連結在 Manus 中一鍵部署：
https://manus.im/create-project?template=web-db-user&github=2297gupy-cloud/bingo-predictor&name=bingo-predictor
```

### 方式 2：在網站上嵌入按鈕

```html
<a href="https://manus.im/create-project?template=web-db-user&github=2297gupy-cloud/bingo-predictor&name=bingo-predictor" class="btn btn-primary">
  在 Manus 中部署
</a>
```

### 方式 3：生成 QR 碼

使用 QR 碼生成工具（如 https://qr-code-generator.com）生成上方連結的 QR 碼。

---

## 📊 連結參數說明

| 參數 | 說明 | 值 |
|------|------|-----|
| `template` | Manus 模板類型 | `web-db-user` |
| `github` | GitHub 倉庫地址 | `2297gupy-cloud/bingo-predictor` |
| `name` | 新專案名稱 | `bingo-predictor` |

---

**準備好了嗎？點擊連結開始部署！** 🚀

---

**最後更新：** 2026-03-09
