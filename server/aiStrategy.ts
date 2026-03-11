import { desc, eq, and, sql, gte, lte } from "drizzle-orm";
import { getDb } from "./db";
import { bingoDraws, aiPredictions, type AiPrediction } from "../drizzle/schema";
import { ENV } from "./_core/env";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// ============ Forge API Setup ============

function getForgeModel() {
  // Use VectorEngine API with Gemini 2.0 Flash
  console.log("[getForgeModel] Using VectorEngine API with gemini-2.0-flash");
  const openai = createOpenAI({
    apiKey: process.env.VECTORENGINE_API_KEY,
    baseURL: "https://api.vectorengine.ai/v1",
  });
  return openai.chat("gemini-2.0-flash");
}

// ============ Time Slot Helpers ============

/** 
 * Get the hour slots for AI analysis.
 * Source: XX:00~XX:55 (12 draws), Target: (XX+1):00~(XX+1):55
 * Special case: 07:05~07:55 (11 draws) → Target: 08:00~08:55
 */
export const HOUR_SLOTS = [
  { source: "07", target: "08", label: "0705~0755", draws: 11 },
  { source: "08", target: "09", label: "0800~0855", draws: 12 },
  { source: "09", target: "10", label: "0900~0955", draws: 12 },
  { source: "10", target: "11", label: "1000~1055", draws: 12 },
  { source: "11", target: "12", label: "1100~1155", draws: 12 },
  { source: "12", target: "13", label: "1200~1255", draws: 12 },
  { source: "13", target: "14", label: "1300~1355", draws: 12 },
  { source: "14", target: "15", label: "1400~1455", draws: 12 },
  { source: "15", target: "16", label: "1500~1555", draws: 12 },
  { source: "16", target: "17", label: "1600~1655", draws: 12 },
  { source: "17", target: "18", label: "1700~1755", draws: 12 },
  { source: "18", target: "19", label: "1800~1855", draws: 12 },
  { source: "19", target: "20", label: "1900~1955", draws: 12 },
  { source: "20", target: "21", label: "2000~2055", draws: 12 },
  { source: "21", target: "22", label: "2100~2155", draws: 12 },
  { source: "22", target: "23", label: "2200~2255", draws: 12 },
];

/**
 * Get the latest 15 draws starting from the last draw of a specific hour.
 * e.g. getHourDraws("2026-03-06", "15") returns the last draw of 15:xx and the next 14 draws
 */
export async function getHourDraws(dateStr: string, hour: string) {
  const db = await getDb();
  if (!db) return [];

  const startTime = `${hour.padStart(2, "0")}:00`;
  const endTime = `${hour.padStart(2, "0")}:55`;

  // Get the last draw of the specified hour
  const lastHourDraw = await db
    .select()
    .from(bingoDraws)
    .where(
      and(
        eq(bingoDraws.drawDate, dateStr),
        gte(bingoDraws.drawTime, startTime),
        lte(bingoDraws.drawTime, endTime)
      )
    )
    .orderBy(desc(bingoDraws.drawTerm))
    .limit(1);

  if (lastHourDraw.length === 0) {
    // No draws yet, return 15 empty slots for the hour
    const timeSlots = Array.from({ length: 15 }, (_, i) => {
      const minutes = i * 5;
      return `${hour.padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    });
    return timeSlots.map(time => ({
      term: "",
      time: time,
      numbers: [],
      pending: true,
    }));
  }

  // Get the last draw's term and fetch the next 15 draws (including itself)
  const lastTerm = parseInt(lastHourDraw[0].drawTerm, 10);
  const startTerm = Math.max(1, lastTerm - 14); // Get 15 draws total

  const draws = await db
    .select()
    .from(bingoDraws)
    .where(
      and(
        gte(bingoDraws.drawTerm, String(startTerm).padStart(9, "0")),
        lte(bingoDraws.drawTerm, String(lastTerm).padStart(9, "0"))
      )
    )
    .orderBy(bingoDraws.drawTerm);

  // Create a map of existing draws by term
  const drawMap = new Map(
    draws.map(d => [d.drawTerm, d])
  );

  // Return 15 draws with pending flag for missing terms
  const result = [];
  for (let i = 0; i < 15; i++) {
    const term = String(startTerm + i).padStart(9, "0");
    const draw = drawMap.get(term);
    if (draw) {
      result.push({
        term: draw.drawTerm,
        time: draw.drawTime,
        numbers: draw.numbers.split(",").map(Number),
        pending: false,
      });
    } else {
      // For pending draws, generate the expected time based on the last draw's time
      // Each draw is 5 minutes apart
      let expectedTime = "";
      if (lastHourDraw.length > 0) {
        const lastTime = lastHourDraw[0].drawTime;
        const [lastHour, lastMinute] = lastTime.split(":").map(Number);
        const termDiff = (startTerm + i) - lastTerm;
        // Calculate total minutes from the last draw
        let totalMinutes = lastMinute + termDiff * 5;
        let newHour = lastHour;
        let newMinute = totalMinutes;
        
        // Handle hour overflow
        while (newMinute >= 60) {
          newMinute -= 60;
          newHour += 1;
        }
        while (newMinute < 0) {
          newMinute += 60;
          newHour -= 1;
        }
        
        expectedTime = `${String(newHour).padStart(2, "0")}:${String(newMinute).padStart(2, "0")}`;
      }
      result.push({
        term: term,
        time: expectedTime,
        numbers: [],
        pending: true,
      });
    }
  }

  return result;
}

// ============ AI Analysis via Forge API ============

/**
 * Build the prompt for AI analysis.
 */
function buildAnalysisPrompt(draws: { term: string; time: string; numbers: number[] }[], sourceLabel: string, dateStr: string): string {
  const drawLines = draws.map(d => 
    `${d.term} | ${d.time} | ${d.numbers.map(n => String(n).padStart(2, "0")).join(" ")}`
  ).join("\n");

  return `BINGO BINGO 專業數據演算報告 (${sourceLabel})

報告日期：${dateStr}

--------------------------------
${drawLines}
--------------------------------

1. 演算之後 ${draws.length} 期出至最佳三顆黃金球數字，展開以下說明

2. 強勢熱門號，「尾數共振」偵測

3. 穩定的連莊號，捕捉剛起步的二連莊趨勢

4. 捕捉斜連交會點，鎖定高機率落球區

5. 縮小斜連跨度執行與精準死碼排除，強化防禦邏輯

6. 核心演算邏輯穩定，不用回測驗證

7. 核心演算結論 (5期策略) 預計期數/推薦組合重點/策略邏輯

請只回傳 JSON 格式，不要有其他文字：
{
  "goldenBalls": [數字1, 數字2, 數字3],
  "reasoning": "簡短分析理由（100字以內）"
}`;
}

/**
 * Call Forge API (via AI SDK) to analyze draws and get 3 golden balls.
 */
export async function callAiForPrediction(
  draws: { term: string; time: string; numbers: number[] }[],
  sourceLabel: string,
  dateStr: string
): Promise<{ goldenBalls: number[]; reasoning: string }> {
  const model = getForgeModel();
  const prompt = buildAnalysisPrompt(draws, sourceLabel, dateStr);

  console.log(`[callAiForPrediction] Calling AI model for ${sourceLabel}...`);
  const { text } = await generateText({
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    maxOutputTokens: 1024,
  });

  if (!text) {
    throw new Error("AI returned empty response");
  }

  // Try to extract JSON from the response (may have markdown code blocks)
  let jsonStr = text;
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const balls = (parsed.goldenBalls || []).map(Number).filter((n: number) => n >= 1 && n <= 80);
    if (balls.length !== 3) {
      throw new Error(`Expected 3 golden balls, got ${balls.length}`);
    }
    return {
      goldenBalls: balls,
      reasoning: parsed.reasoning || "AI 分析完成",
    };
  } catch (err) {
    // Try to extract numbers from text if JSON parsing fails
    const numMatch = text.match(/\d+/g);
    if (numMatch && numMatch.length >= 3) {
      const balls = numMatch.slice(0, 3).map(Number).filter((n: number) => n >= 1 && n <= 80);
      if (balls.length === 3) {
        return { goldenBalls: balls, reasoning: "AI 分析完成" };
      }
    }
    throw new Error(`Failed to parse AI response: ${text.substring(0, 200)}`);
  }
}

// ============ AI Prediction CRUD ============

/**
 * Save AI prediction to database.
 */
export async function saveAiPrediction(
  predDate: string,
  sourceHour: string,
  targetHour: string,
  goldenBalls: number[],
  reasoning: string,
  isManual: boolean = false
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if prediction already exists for this date/source/target
  const existing = await db
    .select()
    .from(aiPredictions)
    .where(
      and(
        eq(aiPredictions.predDate, predDate),
        eq(aiPredictions.sourceHour, sourceHour),
        eq(aiPredictions.targetHour, targetHour)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing
    await db
      .update(aiPredictions)
      .set({
        goldenBalls: goldenBalls.join(","),
        aiReasoning: reasoning,
        isManual: isManual ? 1 : 0,
      })
      .where(eq(aiPredictions.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(aiPredictions).values({
      predDate,
      sourceHour,
      targetHour,
      goldenBalls: goldenBalls.join(","),
      aiReasoning: reasoning,
      isManual: isManual ? 1 : 0,
    });
  }
}

/**
 * Get all AI predictions for a given date.
 */
export async function getAiPredictions(predDate: string): Promise<AiPrediction[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(aiPredictions)
    .where(eq(aiPredictions.predDate, predDate))
    .orderBy(aiPredictions.sourceHour);
}

/**
 * Get a specific AI prediction.
 */
export async function getAiPrediction(predDate: string, sourceHour: string): Promise<AiPrediction | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(aiPredictions)
    .where(
      and(
        eq(aiPredictions.predDate, predDate),
        eq(aiPredictions.sourceHour, sourceHour)
      )
    )
    .limit(1);

  return result[0] || null;
}

// ============ Verification Logic ============

export interface VerificationResult {
  term: string;
  index: number; // 1-12
  time: string;
  hits: number[]; // which golden balls were hit
  missed: number[]; // which golden balls were missed
  isHit: boolean; // at least one golden ball hit
  pending: boolean; // true = not yet drawn
}

/**
 * Verify AI prediction against actual draws in the target hour.
 * Always returns 12 entries; undrawn slots are marked with pending: true.
 */
export async function verifyPrediction(
  predDate: string,
  targetHour: string,
  goldenBalls: number[]
): Promise<VerificationResult[]> {
  const draws = await getHourDraws(predDate, targetHour);
  const hourPad = targetHour.padStart(2, "0");

  // Build the 12 expected time slots for this hour: HH:00, HH:05, ..., HH:55
  const expectedTimes: string[] = [];
  for (let m = 0; m < 60; m += 5) {
    expectedTimes.push(`${hourPad}:${String(m).padStart(2, "0")}`);
  }

  // Build a map of time -> draw
  const drawByTime = new Map(draws.map(d => [d.time, d]));

  return expectedTimes.map((time, idx) => {
    const draw = drawByTime.get(time);
    if (draw) {
      const drawSet = new Set(draw.numbers);
      const hits = goldenBalls.filter(b => drawSet.has(b));
      const missed = goldenBalls.filter(b => !drawSet.has(b));
      return {
        term: draw.term,
        index: idx + 1,
        time,
        hits,
        missed,
        isHit: hits.length > 0,
        pending: false,
      };
    } else {
      // Not yet drawn
      return {
        term: "",
        index: idx + 1,
        time,
        hits: [],
        missed: goldenBalls,
        isHit: false,
        pending: true,
      };
    }
  });
}

// ============ Run AI Analysis for a specific hour ============

/**
 * Run AI analysis: fetch source hour draws, call AI, save prediction.
 */
export async function runAiAnalysis(dateStr: string, sourceHour: string): Promise<{
  goldenBalls: number[];
  reasoning: string;
}> {
  const slot = HOUR_SLOTS.find(s => s.source === sourceHour);
  if (!slot) {
    throw new Error(`Invalid source hour: ${sourceHour}`);
  }

  const draws = await getHourDraws(dateStr, sourceHour);
  if (draws.length < 5) {
    throw new Error(`Not enough draws for hour ${sourceHour}: only ${draws.length} found (need at least 5)`);
  }

  let result;
  try {
    result = await callAiForPrediction(draws, slot.label, dateStr);
  } catch (err) {
    console.error(`[runAiAnalysis] AI call failed for ${sourceHour}:`, err instanceof Error ? err.message : String(err));
    throw err;
  }
  
  // Save to database
  await saveAiPrediction(
    dateStr,
    sourceHour,
    slot.target,
    result.goldenBalls,
    result.reasoning,
    false
  );

  return result;
}

// ============ Batch Analysis ============

/**
 * Batch analyze all hour slots for a given date.
 * Returns analysis results for each slot.
 */
export async function batchAnalyzeDate(dateStr: string): Promise<{
  date: string;
  results: Array<{
    sourceHour: string;
    success: boolean;
    goldenBalls?: number[];
    reasoning?: string;
    error?: string;
  }>;
}> {
  const results = [];
  console.log(`[batchAnalyzeDate] Starting analysis for date: ${dateStr}`);

  // Analyze each hour slot (07-22, skip 23 as it has no next period)
  for (const slot of HOUR_SLOTS) {
    try {
      console.log(`[batchAnalyzeDate] Analyzing slot ${slot.source}...`);
      const result = await runAiAnalysis(dateStr, slot.source);
      console.log(`[batchAnalyzeDate] Slot ${slot.source} success: ${result.goldenBalls.join(',')}`);
      results.push({
        sourceHour: slot.source,
        success: true,
        goldenBalls: result.goldenBalls,
        reasoning: result.reasoning,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error(`[batchAnalyzeDate] Slot ${slot.source} failed: ${errorMsg}`);
      results.push({
        sourceHour: slot.source,
        success: false,
        error: errorMsg,
      });
    }
  }

  console.log(`[batchAnalyzeDate] Completed for date: ${dateStr}. Success: ${results.filter(r => r.success).length}/${results.length}`);
  return {
    date: dateStr,
    results,
  };
}

/**
 * Batch analyze the last N days (including today).
 * Returns analysis results for each day.
 */
export async function batchAnalyzeLastDays(days: number): Promise<{
  daysAnalyzed: number;
  dateResults: Array<{
    date: string;
    success: boolean;
    analyzedSlots: number;
    failedSlots: number;
  }>;
}> {
  const dateResults = [];
  const today = new Date();
  // Convert to UTC+8
  today.setTime(today.getTime() + 8 * 60 * 60 * 1000);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    try {
      const result = await batchAnalyzeDate(dateStr);
      const successCount = result.results.filter(r => r.success).length;
      const failCount = result.results.filter(r => !r.success).length;

      dateResults.push({
        date: dateStr,
        success: failCount === 0,
        analyzedSlots: successCount,
        failedSlots: failCount,
      });
    } catch (err) {
      dateResults.push({
        date: dateStr,
        success: false,
        analyzedSlots: 0,
        failedSlots: HOUR_SLOTS.length,
      });
    }
  }

  return {
    daysAnalyzed: days,
    dateResults,
  };
}

// ============ Get current hour slot info ============

/**
 * Get the current applicable hour slot based on current time (UTC+8).
 */
export function getCurrentHourSlot(): { source: string; target: string; label: string } | null {
  const now = new Date();
  // Convert to UTC+8
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hour = utc8.getUTCHours();
  const minute = utc8.getUTCMinutes();

  // After XX:55, the source hour is the current hour
  // Between XX:00 and XX:55, the source hour is the previous hour
  let sourceHour: number;
  if (minute >= 55) {
    sourceHour = hour;
  } else {
    sourceHour = hour - 1;
  }

  const slot = HOUR_SLOTS.find(s => parseInt(s.source) === sourceHour);
  return slot ? { source: slot.source, target: slot.target, label: slot.label } : null;
}
