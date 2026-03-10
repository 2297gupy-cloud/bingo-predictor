import { getDb } from "./db";
import { aiPredictions, bingoDraws } from "../drizzle/schema";
import { HOUR_SLOTS, getHourDraws, runAiAnalysis } from "./aiStrategy";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * 自動分析任務 - 每天 24:00 執行
 * 對所有 18 個時段進行 AI 測試分析，並保存結果
 */
export async function runDailyAutoAnalysis(dateStr: string) {
  console.log(`[AutoAnalysis] Starting daily auto analysis for ${dateStr}`);

  const db = await getDb();
  if (!db) {
    console.error("[AutoAnalysis] Database not available");
    return;
  }

  try {
    // 遍歷所有時段
    for (const slot of HOUR_SLOTS) {
      try {
        console.log(`[AutoAnalysis] Analyzing slot ${slot.source} for ${dateStr}`);

        // 檢查是否已經分析過
        const existing = await db
          .select()
          .from(aiPredictions)
          .where(
            and(
              eq(aiPredictions.predDate, dateStr),
              eq(aiPredictions.sourceHour, slot.source)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          console.log(
            `[AutoAnalysis] Slot ${slot.source} already analyzed, skipping`
          );
          continue;
        }

        // 執行 AI 分析
        await runAiAnalysis(dateStr, slot.source);

        // 短暫延遲以避免 API 限流
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(
          `[AutoAnalysis] Error analyzing slot ${slot.source}:`,
          error
        );
        // 繼續分析下一個時段
        continue;
      }
    }

    console.log(`[AutoAnalysis] Daily auto analysis completed for ${dateStr}`);
  } catch (error) {
    console.error("[AutoAnalysis] Error during daily auto analysis:", error);
    throw error;
  }
}

/**
 * 查詢過去 N 天的 AI 分析紀錄（驗證記錄格式）
 */
export async function getAnalysisRecords(
  endDate: string,
  days: number = 7
) {
  const db = await getDb();
  if (!db) {
    console.error("[AutoAnalysis] Database not available");
    return [];
  }

  try {
    // 計算開始日期
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));

    const startDateStr = start.toISOString().split("T")[0];

    // 查詢 AI 預測
    const predictions = await db
      .select()
      .from(aiPredictions)
      .where(
        and(
          gte(aiPredictions.predDate, startDateStr),
          lte(aiPredictions.predDate, endDate)
        )
      )
      .orderBy(aiPredictions.predDate, aiPredictions.sourceHour);

    // 為每個預測查詢實際開獎號碼並生成驗證記錄
    const records = await Promise.all(
      predictions.map(async (pred) => {
        // 查詢目標時段的開獎號碼
        const targetHour = pred.targetHour;
        const startTime = `${targetHour.padStart(2, "0")}:00`;
        const endTime = `${targetHour.padStart(2, "0")}:55`;

        const draws = await db
          .select()
          .from(bingoDraws)
          .where(
            and(
              eq(bingoDraws.drawDate, pred.predDate),
              gte(bingoDraws.drawTime, startTime),
              lte(bingoDraws.drawTime, endTime)
            )
          )
          .orderBy(bingoDraws.drawTerm);

        // 計算每期的命中情況（類似驗證結果表）
        const goldenBalls = pred.goldenBalls
          .split(",")
          .map((n) => parseInt(n, 10));

        const verification = draws.map((draw) => {
          const numbers = draw.numbers.split(",").map((n) => parseInt(n, 10));
          const hits = goldenBalls.filter((ball) => numbers.includes(ball));
          const missed = goldenBalls.filter((ball) => !numbers.includes(ball));

          return {
            term: draw.drawTerm,
            time: draw.drawTime,
            hits: hits,
            missed: missed,
            isHit: hits.length > 0,
          };
        });

        // 計算總命中數
        const hitCount = verification.filter((v) => v.isHit).length;

        return {
          date: pred.predDate,
          sourceHour: pred.sourceHour,
          targetHour: pred.targetHour,
          aiPrediction: goldenBalls,
          verification: verification,
          hitCount: hitCount,
          totalDraws: draws.length,
          hitRate: draws.length > 0 ? (hitCount / draws.length) * 100 : 0,
        };
      })
    );

    return records;
  } catch (error) {
    console.error("[AutoAnalysis] Error querying analysis records:", error);
    throw error;
  }
}
