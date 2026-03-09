# 賓果預測器 - 共享數據庫設置指南

## 概述
本文檔說明如何在新帳號中設置賓果預測器應用，使其連接到中央共享數據庫，讓所有用戶共享同一份投注記錄和開獎結果。

## 快速開始

### 步驟 1：在新帳號中建立專案

1. 使用新帳號登錄 Manus
2. 建立新專案，選擇 **web-db-user** 模板
3. 完成基本設置

### 步驟 2：匯入 GitHub 代碼

1. 在新專案的 Management UI 中找到「GitHub」設定
2. 連接到 GitHub 帳號
3. 選擇倉庫：`2297gupy-cloud/bingo-predictor`
4. 點擊「同步」或「匯入」

### 步驟 3：配置共享數據庫

**重要：** 所有應用必須使用相同的 `DATABASE_URL` 才能共享數據。

#### 獲取中央數據庫連接字符串

1. 在原始帳號的 Manus Management UI 中：
   - 進入「Database」面板
   - 複製完整的連接字符串（包括用戶名、密碼、主機等）

2. 或者，在原始帳號的終端中執行：
   ```bash
   echo $DATABASE_URL
   ```

#### 在新帳號中設置數據庫連接

1. 在新專案中，進入「Secrets」設定面板
2. 添加或更新以下環境變數：
   - **DATABASE_URL**: 使用從原始帳號複製的連接字符串

3. 或者，使用 `webdev_request_secrets` 工具設置

### 步驟 4：同步數據庫 Schema

在新專案中執行：
```bash
pnpm db:push
```

這會確保新應用的數據庫 schema 與原始應用保持一致。

### 步驟 5：啟動應用

```bash
pnpm dev
```

新應用現在將連接到中央數據庫，所有投注記錄和開獎結果都將共享。

## 驗證共享數據庫

### 測試數據同步

1. **在原始應用中添加投注**
   - 進行一次投注，記錄投注金額和期數

2. **在新應用中查看**
   - 刷新新應用的結果頁面
   - 應該能看到剛才添加的投注記錄

3. **反向測試**
   - 在新應用中添加投注
   - 在原始應用中查看是否同步

## 常見問題

### Q: 多個應用同時使用會不會衝突？
A: 不會。只要使用相同的 DATABASE_URL，所有應用都會共享同一份數據，不會有衝突。

### Q: 如何確保數據安全？
A: 
- 不要在公開的地方分享 DATABASE_URL
- 使用 Manus 的環境變數管理功能保護敏感信息
- 定期備份數據庫

### Q: 可以限制用戶只看到自己的投注嗎？
A: 可以。需要修改應用代碼，在查詢時添加用戶過濾條件。詳見下方「高級配置」。

## 高級配置

### 實現用戶數據隔離

如果您想讓每個用戶只看到自己的投注記錄，需要修改應用代碼：

1. **在 `drizzle/schema.ts` 中添加 `userId` 字段**
   ```typescript
   export const bets = sqliteTable('bets', {
     id: integer('id').primaryKey(),
     userId: text('user_id').notNull(),  // 添加用戶 ID
     // ... 其他字段
   });
   ```

2. **在 `server/routers.ts` 中修改查詢**
   ```typescript
   // 只返回當前用戶的投注
   const userBets = await db.query.bets.findMany({
     where: (bets, { eq }) => eq(bets.userId, ctx.user.id),
   });
   ```

3. **執行數據庫遷移**
   ```bash
   pnpm db:push
   ```

## 環境變數參考

| 變數名 | 說明 | 示例 |
|--------|------|------|
| DATABASE_URL | 數據庫連接字符串 | `mysql://user:pass@host:3306/dbname` |
| VITE_APP_TITLE | 應用標題 | `賓果預測器` |
| VITE_APP_LOGO | 應用 Logo URL | `https://...` |

## 支持

如有問題，請聯繫開發團隊或查看 GitHub 倉庫：
https://github.com/2297gupy-cloud/bingo-predictor

---

**最後更新：** 2026-03-09
**版本：** 1.0
