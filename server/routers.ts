import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  getConsecutiveStats,
  getDbStats,
  getFrequencyStats,
  getLatestDraw,
  getRepeatedTriples,
  predict,
  syncRecentDays,
} from "./bingo";
import { getDb } from "./db";
import { bingoDraws } from "../drizzle/schema";
import { desc, like } from "drizzle-orm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  bingo: router({
    // 取得最新一期開獎結果
    latest: publicProcedure.query(async () => {
      return await getLatestDraw();
    }),

    // 取得資料庫統計
    dbStats: publicProcedure.query(async () => {
      return await getDbStats();
    }),

    // 號碼頻率統計
    frequency: publicProcedure
      .input(z.object({ window: z.number().min(1).max(200).default(20) }).optional())
      .query(async ({ input }) => {
        return await getFrequencyStats(input?.window ?? 20);
      }),

    // 連莊號碼統計
    consecutive: publicProcedure
      .input(z.object({ window: z.number().min(1).max(200).default(5) }).optional())
      .query(async ({ input }) => {
        return await getConsecutiveStats(input?.window ?? 5);
      }),

    // 重複三球統計
    repeatedTriples: publicProcedure
      .input(z.object({ window: z.number().min(2).max(200).default(5) }).optional())
      .query(async ({ input }) => {
        return await getRepeatedTriples(input?.window ?? 5);
      }),

    // 號碼預測
    predict: publicProcedure
      .input(
        z.object({
          strategy: z.enum(["hot", "cold", "balanced", "weighted", "overdue"]).default("balanced"),
          pick: z.number().min(1).max(20).default(5),
          window: z.number().min(1).max(200).default(20),
        })
      )
      .query(async ({ input }) => {
        return await predict(input.strategy, input.pick, input.window);
      }),

    // 同步最近資料
    sync: publicProcedure
      .input(z.object({ days: z.number().min(1).max(30).default(3) }).optional())
      .mutation(async ({ input }) => {
        const count = await syncRecentDays(input?.days ?? 3);
        return { synced: count };
      }),

    // 歷史紀錄（分頁）
    history: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          pageSize: z.number().min(5).max(100).default(20),
          date: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const db = await getDb();
        if (!db) return { draws: [], total: 0, page: input.page, pageSize: input.pageSize };

        const offset = (input.page - 1) * input.pageSize;

        let query = db.select().from(bingoDraws);
        let countQuery = db.select({ count: (await import("drizzle-orm")).sql<number>`count(*)` }).from(bingoDraws);

        if (input.date) {
          query = query.where(like(bingoDraws.drawDate, `${input.date}%`)) as typeof query;
          countQuery = countQuery.where(like(bingoDraws.drawDate, `${input.date}%`)) as typeof countQuery;
        }

        const [draws, countResult] = await Promise.all([
          query.orderBy(desc(bingoDraws.drawTerm)).limit(input.pageSize).offset(offset),
          countQuery,
        ]);

        return {
          draws: draws.map(d => ({
            term: d.drawTerm,
            draw_date: d.drawDate,
            draw_time: d.drawTime,
            numbers: d.numbers.split(",").map(Number),
            draw_order: d.drawOrder.split(",").map(Number),
            special: d.special,
            big_small: d.bigSmall,
            odd_even: d.oddEven,
          })),
          total: countResult[0]?.count ?? 0,
          page: input.page,
          pageSize: input.pageSize,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
