import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const bingoDraws = mysqlTable("bingo_draws", {
  id: int("id").autoincrement().primaryKey(),
  drawTerm: varchar("drawTerm", { length: 20 }).notNull().unique(),
  drawDate: varchar("drawDate", { length: 10 }).notNull(),
  drawTime: varchar("drawTime", { length: 5 }).notNull(),
  numbers: text("numbers").notNull(), // comma-separated sorted numbers
  drawOrder: text("drawOrder").notNull(), // comma-separated original order
  special: int("special").notNull(), // super number
  bigSmall: varchar("bigSmall", { length: 4 }).notNull(), // 大/小
  oddEven: varchar("oddEven", { length: 4 }).notNull(), // 單/雙
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BingoDraw = typeof bingoDraws.$inferSelect;
export type InsertBingoDraw = typeof bingoDraws.$inferInsert;

// AI 一星策略預測結果
export const aiPredictions = mysqlTable("ai_predictions", {
  id: int("id").autoincrement().primaryKey(),
  predDate: varchar("predDate", { length: 10 }).notNull(), // e.g. 115/03/06
  sourceHour: varchar("sourceHour", { length: 5 }).notNull(), // e.g. "15" (分析 15:00~15:55)
  targetHour: varchar("targetHour", { length: 5 }).notNull(), // e.g. "16" (驗證 16:00~16:55)
  goldenBalls: varchar("goldenBalls", { length: 20 }).notNull(), // e.g. "30,12,46"
  aiReasoning: text("aiReasoning"), // AI 分析理由
  isManual: int("isManual").default(0).notNull(), // 0=AI, 1=手動輸入
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiPrediction = typeof aiPredictions.$inferSelect;
export type InsertAiPrediction = typeof aiPredictions.$inferInsert;
