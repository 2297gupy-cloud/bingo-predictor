import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createPatchedFetch } from "./_core/patchedFetch";
import { ENV } from "./_core/env";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { bingoDraws } from "../drizzle/schema";

// ============ Forge API Setup ============

function getForgeModel() {
  const openai = createOpenAI({
    apiKey: ENV.forgeApiKey,
    baseURL: `${ENV.forgeApiUrl}/v1`,
    fetch: createPatchedFetch(globalThis.fetch),
  });
  return openai.chat("gemini-2.5-flash");
}

// ============ Database Connection ============

async function getDatabase() {
  if (!ENV.databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  return drizzle(ENV.databaseUrl);
}

// ============ Data Collection ============

/**
 * 獲取指定日期的所有開獎數據
 */
async function getDrawsByDate(dateStr: string) {
  const db = await getDatabase();
  const results = await db
    .select()
    .from(bingoDraws)
    .where(eq(bingoDraws.drawDate, dateStr));
  return results;
}

/**
 * 格式化開獎數據為 AI 分析用的文本
 */
function formatDataForAnalysis(periods: any[]): string {
  const formattedPeriods = periods
    .map((p) => {
      const numbers = p.numbers
        .split(",")
        .map((n: string) => n.trim())
        .join(" ");
      return `期號: ${p.drawTerm}, 時間: ${p.drawTime}, 號碼: ${numbers}`;
    })
    .join("\n");

  return `以下是最近 12 期的開獎數據：\n${formattedPeriods}`;
}

/**
 * 使用 Forge API 分析數據並預測三顆黃金球
 */
export async function analyzeWithForge(hour: number, date: Date) {
  try {
    // 獲取該日期的所有開獎數據
    const dateStr = date.toISOString().split("T")[0];
    const allDraws = await getDrawsByDate(dateStr);

    if (allDraws.length === 0) {
      return {
        success: false,
        error: "No data available for this date",
      };
    }

    // 篩選指定時段的期數
    const hourStr = String(hour).padStart(2, "0");
    const hourDraws = allDraws.filter((d: any) => d.drawTime.startsWith(hourStr));

    if (hourDraws.length === 0) {
      return {
        success: false,
        error: `No data available for hour ${hourStr}`,
      };
    }

    // 取最後 12 期
    const periods = hourDraws.slice(-12);

    if (periods.length === 0) {
      return {
        success: false,
        error: "Not enough data for analysis",
      };
    }

    // 格式化數據
    const dataText = formatDataForAnalysis(periods);

    // 準備 AI 提示詞
    const prompt = `${dataText}

請分析上述開獎數據，並按照以下要求提供分析結果：

1. 統計每個號碼在這些期數內出現的次數
2. 找出出現頻率最高的三個號碼（必殺黃金三星）
3. 提供簡短的分析說明

請以以下格式回傳結果：
黃金三星: [號碼1] [號碼2] [號碼3]
分析說明: [簡短說明]`;

    // 調用 Forge API
    const { text } = await generateText({
      model: getForgeModel(),
      prompt,
      temperature: 0.7,
    });

    // 解析回傳結果 - 支持多種格式
    let goldenBalls: number[] = [];
    
    // 嘗試多種格式的正則表達式
    const formats = [
      /黃金三星[：:]*\s*([\d\s,，、]+)/,  // 支持各種分隔符
      /必殺黃金三星[：:]*\s*([\d\s,，、]+)/,
      /三星[：:]*\s*([\d\s,，、]+)/,
    ];
    
    let ballsText = "";
    for (const format of formats) {
      const match = text.match(format);
      if (match) {
        ballsText = match[1];
        break;
      }
    }
    
    if (ballsText) {
      // 提取所有數字
      const numbers = ballsText.match(/\d+/g);
      if (numbers && numbers.length >= 3) {
        goldenBalls = numbers.slice(0, 3).map(n => parseInt(n));
      }
    }
    
    const analysisMatch = text.match(/分析說明[：:]*\s*(.+?)(?:\n|$)/);

    if (goldenBalls.length !== 3) {
      console.log("[Forge Analysis] Raw response:", text);
      return {
        success: false,
        error: "Failed to parse AI response",
        rawResponse: text,
      };
    }

    const analysis = analysisMatch ? analysisMatch[1].trim() : "AI 分析完成";

    return {
      success: true,
      goldenBalls,
      analysis,
      rawResponse: text,
    };
  } catch (error) {
    console.error("[Forge Analysis Error]", error);
    return {
      success: false,
      error: String(error),
    };
  }
}

/**
 * 驗證預測結果
 */
export async function verifyPrediction(
  goldenBalls: number[],
  hour: number,
  date: Date
) {
  try {
    // 獲取該日期的所有開獎數據
    const dateStr = date.toISOString().split("T")[0];
    const allDraws = await getDrawsByDate(dateStr);

    if (allDraws.length === 0) {
      return {
        success: false,
        error: "No data available for verification",
      };
    }

    // 篩選指定時段的期數
    const hourStr = String(hour).padStart(2, "0");
    const hourDraws = allDraws.filter((d: any) => d.drawTime.startsWith(hourStr));

    if (hourDraws.length === 0) {
      return {
        success: false,
        error: "No data available for verification",
      };
    }

    // 驗證每期是否命中
    const results = hourDraws.map((period: any) => {
      const numbers = period.numbers
        .split(",")
        .map((n: string) => parseInt(n.trim()));
      const hitCount = goldenBalls.filter((ball: number) =>
        numbers.includes(ball)
      ).length;

      return {
        drawNumber: period.drawTerm,
        drawTime: period.drawTime,
        numbers,
        hitCount,
        isHit: hitCount > 0,
      };
    });

    const totalHits = results.filter((r: any) => r.isHit).length;
    const hitRate = results.length > 0 ? ((totalHits / results.length) * 100).toFixed(1) : "0";

    return {
      success: true,
      results,
      totalHits,
      hitRate: `${hitRate}%`,
    };
  } catch (error) {
    console.error("[Verification Error]", error);
    return {
      success: false,
      error: String(error),
    };
  }
}
