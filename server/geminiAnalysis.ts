import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getDb } from "./db";
import { bingoDraws } from "../drizzle/schema";
import { desc, and, eq, gte, lte } from "drizzle-orm";

// ============ Gemini API Setup ============

function getGeminiModel() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
  });
  return google("gemini-2.0-flash");
}

// ============ Data Collection ============

/**
 * 收集過去 5 期的統計數據
 * 用於 Gemini 分析
 */
export async function collectLast5PeriodsStats(dateStr: string, sourceHour: string) {
  const db = await getDb();
  if (!db) return null;

  // 獲取指定時段的最後 5 期開獎
  const draws = await db
    .select()
    .from(bingoDraws)
    .where(
      and(
        eq(bingoDraws.drawDate, dateStr),
        gte(bingoDraws.drawTime, `${sourceHour.padStart(2, "0")}:00`),
        lte(bingoDraws.drawTime, `${sourceHour.padStart(2, "0")}:55`)
      )
    )
    .orderBy(desc(bingoDraws.drawTerm))
    .limit(5);

  if (draws.length === 0) return null;

  // 統計號碼頻率
  const numberFrequency: Record<number, number> = {};
  const allNumbers: number[] = [];

  draws.forEach(draw => {
    const numbers = draw.numbers.split(",").map(n => parseInt(n.trim()));
    numbers.forEach(num => {
      numberFrequency[num] = (numberFrequency[num] || 0) + 1;
      allNumbers.push(num);
    });
  });

  // 計算統計數據
  const sortedNumbers = Object.entries(numberFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([num, freq]) => ({ number: parseInt(num), frequency: freq }));

  return {
    period: draws[0].drawTerm,
    date: dateStr,
    sourceHour,
    totalDraws: draws.length,
    draws: draws.map(d => ({
      term: d.drawTerm,
      time: d.drawTime,
      numbers: d.numbers.split(",").map(n => parseInt(n.trim())),
    })),
    numberFrequency: sortedNumbers,
    topNumbers: sortedNumbers.slice(0, 10),
    bottomNumbers: sortedNumbers.slice(-10),
  };
}

// ============ Gemini Analysis ============

/**
 * 使用 Gemini 1.5 Flash 進行專業數據分析
 * 返回 5 期內必殺黃金三星
 */
export async function analyzeWithGemini(dateStr: string, sourceHour: string) {
  try {
    // 收集統計數據
    const statsData = await collectLast5PeriodsStats(dateStr, sourceHour);
    if (!statsData) {
      return {
        success: false,
        error: "無法收集統計數據",
        goldenBalls: [],
      };
    }

    // 準備 Gemini 提示
    const prompt = `
你是一位專業的數據分析師，專門分析彩票開獎數據。

以下是過去 5 期的開獎統計數據：

【開獎期數】${statsData.period}
【分析日期】${statsData.date}
【分析時段】${statsData.sourceHour}:00~${statsData.sourceHour}:55
【總開獎次數】${statsData.totalDraws}

【最近 5 期開獎結果】
${statsData.draws
  .map(
    d =>
      `期數: ${d.term}, 時間: ${d.time}, 開獎號碼: ${d.numbers.join(", ")}`
  )
  .join("\n")}

【號碼頻率排行（前 10）】
${statsData.topNumbers
  .map((item, idx) => `${idx + 1}. 號碼 ${item.number}: 出現 ${item.frequency} 次`)
  .join("\n")}

【號碼冷門排行（後 10）】
${statsData.bottomNumbers
  .map((item, idx) => `${idx + 1}. 號碼 ${item.number}: 出現 ${item.frequency} 次`)
  .join("\n")}

請根據以上數據，按照以下格式進行分析並回傳結果：

【專業數據演算報告】

【分析摘要】
簡要說明數據特徵和趨勢

【必殺黃金三星】
根據頻率分析、冷熱號碼平衡、連續性等因素，選出 3 個最有潛力的號碼

【分析依據】
詳細解釋選擇這 3 個號碼的原因

【風險提示】
說明此分析的局限性和風險

請直接回傳分析結果，不需要額外說明。
`;

    // 調用 Gemini API
    const model = getGeminiModel();
    const response = await generateText({
      model,
      prompt,
      temperature: 0.7,
    });

    // 解析回應中的黃金三星
    const goldenBalls = extractGoldenBalls(response.text);

    return {
      success: true,
      analysis: response.text,
      goldenBalls,
      statsData,
    };
  } catch (error: any) {
    console.error("Gemini 分析錯誤:", error);
    return {
      success: false,
      error: error.message || "Gemini API 調用失敗",
      goldenBalls: [],
    };
  }
}

/**
 * 從 Gemini 回應中提取黃金三星號碼
 */
function extractGoldenBalls(text: string): number[] {
  const goldenBalls: number[] = [];

  // 嘗試多種模式來提取號碼
  const patterns = [
    /【必殺黃金三星】[\s\S]*?(\d{1,2})[、，\s]+(\d{1,2})[、，\s]+(\d{1,2})/,
    /必殺黃金三星[\s\S]*?(\d{1,2})[、，\s]+(\d{1,2})[、，\s]+(\d{1,2})/,
    /黃金三星[\s\S]*?(\d{1,2})[、，\s]+(\d{1,2})[、，\s]+(\d{1,2})/,
    /(\d{1,2})[、，\s]+(\d{1,2})[、，\s]+(\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const nums = [
        parseInt(match[1]),
        parseInt(match[2]),
        parseInt(match[3]),
      ].filter(n => n >= 1 && n <= 80);

      if (nums.length === 3) {
        return nums;
      }
    }
  }

  // 如果無法提取，返回空陣列
  return [];
}


