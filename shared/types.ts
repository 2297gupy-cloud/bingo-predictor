/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// ============ Bingo Types ============

export interface BingoDrawResult {
  term: string;
  draw_date: string;
  draw_time: string;
  numbers: number[];
  draw_order: number[];
  special: number;
  big_small: string;
  odd_even: string;
}

export interface FrequencyItem {
  number: number;
  count: number;
}

export interface ConsecutiveItem {
  number: number;
  streak: number;
}

export interface PredictionResult {
  numbers: number[];
  strategy: string;
  description: string;
}

export interface DbStats {
  total_draws: number;
  latest_term: string;
  latest_date: string;
  latest_time: string;
}

export type StrategyType = "hot" | "cold" | "balanced" | "weighted" | "overdue";

export const STRATEGY_LABELS: Record<StrategyType, string> = {
  hot: "追熱策略",
  cold: "補冷策略",
  balanced: "均衡策略",
  weighted: "加權隨機",
  overdue: "到期策略",
};

export const STRATEGY_DESCRIPTIONS: Record<StrategyType, string> = {
  hot: "選近期出現頻率最高的號碼",
  cold: "選久未出現的冷門號碼",
  balanced: "混合熱號與冷號",
  weighted: "依歷史頻率加權隨機選取",
  overdue: "選連續最久未出現的號碼",
};
