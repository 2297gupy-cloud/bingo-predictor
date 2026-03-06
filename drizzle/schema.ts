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
