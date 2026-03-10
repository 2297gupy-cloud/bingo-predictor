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
import { analyzeWithForge } from "./forgeAnalysis";
import {
  HOUR_SLOTS,
  getAiPredictions,
  getAiPrediction,
  runAiAnalysis,
  verifyPrediction,
  saveAiPrediction,
  getHourDraws,
  getCurrentHourSlot,
  batchAnalyzeDate,
  batchAnalyzeLastDays,
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

    // AI 一星策略：手動輸入 1~6 顆球
    aiManualInput: publicProcedure
      .input(z.object({
        date: z.string(),
        sourceHour: z.string(),
        goldenBalls: z.array(z.number().min(1).max(80)).min(1).max(6),
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

    // AI 一星策略：刪除指定時段的預測結果
    aiDeletePrediction: publicProcedure
      .input(z.object({
        date: z.string(),
        sourceHour: z.string(),
      }))
      .mutation(async ({ input }) => {
        const db = await getDb();
        if (!db) throw new Error("DB unavailable");
        const { aiPredictions: aiPred } = await import("../drizzle/schema");
        const { and: dbAnd, eq: dbEq } = await import("drizzle-orm");
        await db.delete(aiPred).where(
          dbAnd(
            dbEq(aiPred.predDate, input.date),
            dbEq(aiPred.sourceHour, input.sourceHour)
          )
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

    // AI 一星策略：取得格式化的整點數據（供複製用）
    aiFormattedData: publicProcedure
      .input(z.object({ date: z.string(), hour: z.string() }))
      .query(async ({ input }) => {
        const draws = await getHourDraws(input.date, input.hour);
        const slot = HOUR_SLOTS.find(s => s.source === input.hour);
        if (!slot || draws.length === 0) return { text: "" };

        // Convert date to ROC year format
        const [yyyy, mm, dd] = input.date.split("-");
        const rocYear = parseInt(yyyy) - 1911;
        const dateFormatted = `${rocYear}/${mm}/${dd}`;

        const drawLines = draws.map(d =>
          `${d.term} | ${d.time} | ${d.numbers.map(n => String(n).padStart(2, "0")).join(" ")}`
        ).join("\n");

        const text = `BINGO BINGO 專業數據演算報告 (${slot.label})\n報告日期：${dateFormatted}\n--------------------------------\n${drawLines}\n--------------------------------\n1. 演算之後 12 期出至最佳三顆黃金球數字，展開以下說明\n2. 強勢熱門號，「尾數共振」偵測\n3. 穩定的連莊號，捕捉剛起步的二連莊趨勢\n4. 捕捉斜連交會點，鎖定高機率落球區\n5. 縮小斜連跨度執行與精準死碼排除，強化防禦邏輯\n6. 核心演算邏輯穩定，不用回測驗證\n7. 核心演算結論 (5期策略) 預計期數/推薦組合重點/策略邏輯`;

        return { text };
      }),

    // AI 一星策略：Forge API 測試
    aiGeminiTest: publicProcedure
      .input(z.object({
        date: z.string(),
        sourceHour: z.string(),
      }))
      .mutation(async ({ input }) => {
        const date = new Date(input.date);
        const hour = parseInt(input.sourceHour);
        const result = await analyzeWithForge(hour, date);
        
        // Save to database if analysis successful
        if (result.success && result.goldenBalls) {
          const slot = HOUR_SLOTS.find(s => s.source === input.sourceHour);
          if (slot) {
            await saveAiPrediction(
              input.date,
              input.sourceHour,
              slot.target,
              result.goldenBalls,
              result.analysis || "Forge AI 分析",
              false
            );
          }
        }
        
        return result;
      }),

    // 查詢過去 N 天的 AI 分析紀錄
    // AI 一星策略：批量分析指定日期的所有時段
    batchAnalyzeDate: publicProcedure
      .input(z.object({
        date: z.string(),
      }))
      .mutation(async ({ input }) => {
        return await batchAnalyzeDate(input.date);
      }),

    // AI 一星策略：批量分析過去 N 天
    batchAnalyzeLastDays: publicProcedure
      .input(z.object({
        days: z.number().min(1).max(30).default(7),
      }))
      .mutation(async ({ input }) => {
        return await batchAnalyzeLastDays(input.days);
      }),

    analysisRecords: publicProcedure
      .input(z.object({
        endDate: z.string().optional(),
        days: z.number().min(1).max(30).default(7),
      }))
      .query(async ({ input }) => {
        const { getAnalysisRecords } = await import('./autoAnalysis');
        const endDate = input.endDate || new Date().toISOString().split('T')[0];
        return await getAnalysisRecords(endDate, input.days);
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
