import { desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import { bingoDraws, type InsertBingoDraw } from "../drizzle/schema";

// ============ Data Fetching from Taiwan Lottery API ============

interface BingoQueryResult {
  drawTerm: number;
  bigShowOrder: string[];
  openShowOrder: string[];
  bullEyeTop: string;
  highLowTop: string;
  oddEvenTop: string;
}

export async function fetchBingoDataFromAPI(dateStr: string): Promise<BingoQueryResult[]> {
  const allResults: BingoQueryResult[] = [];
  let pageNum = 1;
  const pageSize = 50;

  while (true) {
    const url = `https://api.taiwanlottery.com/TLCAPIWeB/Lottery/BingoResult?openDate=${dateStr}&pageNum=${pageNum}&pageSize=${pageSize}`;
    try {
      const response = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (!response.ok) break;
      const data = await response.json();
      if (data?.rtCode !== 0 || !data?.content?.bingoQueryResult) break;
      const results = data.content.bingoQueryResult as BingoQueryResult[];
      allResults.push(...results);
      if (allResults.length >= data.content.totalSize) break;
      pageNum++;
      await new Promise(r => setTimeout(r, 300));
    } catch (err) {
      console.error(`[Bingo] Failed to fetch page ${pageNum} for ${dateStr}:`, err);
      break;
    }
  }
  return allResults;
}

export function processRawData(rawData: BingoQueryResult[], dateStr: string): InsertBingoDraw[] {
  return rawData.map(res => {
    const term = String(res.drawTerm);
    const seq = parseInt(term.slice(-3), 10);
    const startHour = 7;
    const totalMinutes = startHour * 60 + seq * 5;
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const mins = (totalMinutes % 60).toString().padStart(2, "0");
    const drawTime = `${hours}:${mins}`;

    // bigShowOrder contains sorted numbers as strings
    const sortedNumbers = (res.bigShowOrder || []).map(Number).sort((a, b) => a - b);
    // openShowOrder contains draw order as strings
    const drawOrder = (res.openShowOrder || []).map(Number);

    const special = Number(res.bullEyeTop) || 0;
    const sum = sortedNumbers.reduce((a, b) => a + b, 0);
    const bigSmall = sum > 810 ? "大" : sum < 810 ? "小" : "和";
    const oddEven = sum % 2 === 1 ? "單" : "雙";

    return {
      drawTerm: term,
      drawDate: dateStr,
      drawTime,
      numbers: sortedNumbers.join(","),
      drawOrder: drawOrder.join(","),
      special,
      bigSmall,
      oddEven,
    };
  });
}

// ============ Database Operations ============

export async function syncBingoData(dateStr: string): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const rawData = await fetchBingoDataFromAPI(dateStr);
  if (rawData.length === 0) return 0;

  const processed = processRawData(rawData, dateStr);
  let inserted = 0;

  for (const draw of processed) {
    try {
      await db.insert(bingoDraws).values(draw).onDuplicateKeyUpdate({
        set: { numbers: draw.numbers, drawOrder: draw.drawOrder },
      });
      inserted++;
    } catch {
      // skip errors
    }
  }
  return inserted;
}

export async function getLatestDraw() {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(bingoDraws)
    .orderBy(desc(bingoDraws.drawTerm))
    .limit(1);

  if (result.length === 0) return null;

  const draw = result[0];
  return {
    term: draw.drawTerm,
    draw_date: draw.drawDate,
    draw_time: draw.drawTime,
    numbers: draw.numbers.split(",").map(Number),
    draw_order: draw.drawOrder.split(",").map(Number),
    special: draw.special,
    big_small: draw.bigSmall,
    odd_even: draw.oddEven,
  };
}

export async function getDbStats() {
  const db = await getDb();
  if (!db) return { total_draws: 0, latest_term: "", latest_date: "", latest_time: "" };

  const countResult = await db.select({ count: sql<number>`count(*)` }).from(bingoDraws);
  const latest = await db.select().from(bingoDraws).orderBy(desc(bingoDraws.drawTerm)).limit(1);

  return {
    total_draws: countResult[0]?.count ?? 0,
    latest_term: latest[0]?.drawTerm ?? "",
    latest_date: latest[0]?.drawDate ?? "",
    latest_time: latest[0]?.drawTime ?? "",
  };
}

export async function getFrequencyStats(window: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const draws = await db
    .select()
    .from(bingoDraws)
    .orderBy(desc(bingoDraws.drawTerm))
    .limit(window);

  const freq: Record<number, number> = {};
  for (let i = 1; i <= 80; i++) freq[i] = 0;

  for (const draw of draws) {
    const nums = draw.numbers.split(",").map(Number);
    for (const n of nums) {
      freq[n] = (freq[n] || 0) + 1;
    }
  }

  return Object.entries(freq)
    .map(([num, count]) => ({ number: Number(num), count }))
    .sort((a, b) => a.number - b.number);
}

export async function getConsecutiveStats(window: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const draws = await db
    .select()
    .from(bingoDraws)
    .orderBy(desc(bingoDraws.drawTerm))
    .limit(window);

  if (draws.length < 2) return [];

  const streaks: Record<number, number> = {};
  for (let i = 1; i <= 80; i++) streaks[i] = 0;

  for (let num = 1; num <= 80; num++) {
    let streak = 0;
    for (const draw of draws) {
      const nums = draw.numbers.split(",").map(Number);
      if (nums.includes(num)) {
        streak++;
      } else {
        break;
      }
    }
    streaks[num] = streak;
  }

  return Object.entries(streaks)
    .filter(([_, count]) => count >= 2)
    .map(([num, count]) => ({ number: Number(num), streak: count }))
    .sort((a, b) => b.streak - a.streak);
}

// ============ Prediction Strategies ============

export async function predict(
  strategy: string,
  pick: number = 5,
  window: number = 20
): Promise<{ numbers: number[]; strategy: string; description: string }> {
  const freq = await getFrequencyStats(window);
  let selected: number[] = [];
  let description = "";

  switch (strategy) {
    case "hot": {
      description = "追熱策略：選近期出現頻率最高的號碼";
      const sorted = [...freq].sort((a, b) => b.count - a.count);
      selected = sorted.slice(0, pick).map(f => f.number);
      break;
    }
    case "cold": {
      description = "補冷策略：選久未出現的冷門號碼";
      const sorted = [...freq].sort((a, b) => a.count - b.count);
      selected = sorted.slice(0, pick).map(f => f.number);
      break;
    }
    case "balanced": {
      description = "均衡策略：混合熱號與冷號";
      const sorted = [...freq].sort((a, b) => b.count - a.count);
      const hotPick = Math.ceil(pick / 2);
      const coldPick = pick - hotPick;
      const hot = sorted.slice(0, hotPick).map(f => f.number);
      const cold = sorted.slice(-coldPick).map(f => f.number);
      selected = [...hot, ...cold];
      break;
    }
    case "weighted": {
      description = "加權隨機：依歷史頻率加權隨機選取";
      const totalWeight = freq.reduce((sum, f) => sum + f.count + 1, 0);
      const pool = [...freq];
      while (selected.length < pick && pool.length > 0) {
        let rand = Math.random() * totalWeight;
        for (let i = 0; i < pool.length; i++) {
          rand -= pool[i].count + 1;
          if (rand <= 0) {
            selected.push(pool[i].number);
            pool.splice(i, 1);
            break;
          }
        }
      }
      break;
    }
    case "overdue": {
      description = "到期策略：選連續最久未出現的號碼";
      const db = await getDb();
      if (!db) break;
      const draws = await db
        .select()
        .from(bingoDraws)
        .orderBy(desc(bingoDraws.drawTerm))
        .limit(100);

      const lastSeen: Record<number, number> = {};
      for (let i = 1; i <= 80; i++) lastSeen[i] = draws.length;

      for (let idx = 0; idx < draws.length; idx++) {
        const nums = draws[idx].numbers.split(",").map(Number);
        for (const n of nums) {
          if (lastSeen[n] === draws.length) {
            lastSeen[n] = idx;
          }
        }
      }

      const sorted = Object.entries(lastSeen)
        .map(([num, idx]) => ({ number: Number(num), lastSeen: idx }))
        .sort((a, b) => b.lastSeen - a.lastSeen);
      selected = sorted.slice(0, pick).map(f => f.number);
      break;
    }
    default: {
      description = "均衡策略：混合熱號與冷號";
      const sorted = [...freq].sort((a, b) => b.count - a.count);
      const hotPick = Math.ceil(pick / 2);
      const coldPick = pick - hotPick;
      selected = [
        ...sorted.slice(0, hotPick).map(f => f.number),
        ...sorted.slice(-coldPick).map(f => f.number),
      ];
    }
  }

  return {
    numbers: selected.sort((a, b) => a - b),
    strategy,
    description,
  };
}

// ============ Sync multiple days ============

export async function syncRecentDays(days: number = 3): Promise<number> {
  let total = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const count = await syncBingoData(dateStr);
    total += count;
    await new Promise(r => setTimeout(r, 500));
  }
  return total;
}
