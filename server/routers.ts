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
import {
  HOUR_SLOTS,
  getAiPredictions,
  getAiPrediction,
  runAiAnalysis,
  verifyPrediction,
  saveAiPrediction,
  getHourDraws,
  getCurrentHourSlot,
} from "./aiStrategy";
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

    // AI 一星策略：取得所有時段預測
    aiPredictions: publicProcedure
      .input(z.object({ date: z.string() }))
      .query(async ({ input }) => {
        const predictions = await getAiPredictions(input.date);
        // For each prediction, also get verification results
        const results = await Promise.all(
          predictions.map(async (pred) => {
            const balls = pred.goldenBalls.split(",").map(Number);
            const verification = await verifyPrediction(pred.predDate, pred.targetHour, balls);
            return {
              id: pred.id,
              predDate: pred.predDate,
              sourceHour: pred.sourceHour,
              targetHour: pred.targetHour,
              goldenBalls: balls,
              reasoning: pred.aiReasoning,
              isManual: pred.isManual === 1,
              verification,
            };
          })
        );
        return results;
      }),

    // AI 一星策略：執行 AI 分析
    aiAnalyze: publicProcedure
      .input(z.object({
        date: z.string(),
        sourceHour: z.string(),
      }))
      .mutation(async ({ input }) => {
        const result = await runAiAnalysis(input.date, input.sourceHour);
        return result;
      }),

    // AI 一星策略：手動輸入三顆球
    aiManualInput: publicProcedure
      .input(z.object({
        date: z.string(),
        sourceHour: z.string(),
        goldenBalls: z.array(z.number().min(1).max(80)).length(3),
      }))
      .mutation(async ({ input }) => {
        const slot = HOUR_SLOTS.find(s => s.source === input.sourceHour);
        if (!slot) throw new Error("Invalid source hour");
        await saveAiPrediction(
          input.date,
          input.sourceHour,
          slot.target,
          input.goldenBalls,
          "手動輸入",
          true
        );
        return { success: true };
      }),

    // AI 一星策略：取得時段列表和目前時段
    aiHourSlots: publicProcedure.query(() => {
      const current = getCurrentHourSlot();
      return {
        slots: HOUR_SLOTS,
        currentSlot: current,
      };
    }),

    // AI 一星策略：取得指定時段的開獎資料
    aiHourDraws: publicProcedure
      .input(z.object({ date: z.string(), hour: z.string() }))
      .query(async ({ input }) => {
        return await getHourDraws(input.date, input.hour);
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
