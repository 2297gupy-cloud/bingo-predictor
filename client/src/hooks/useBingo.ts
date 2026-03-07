import { trpc } from "@/lib/trpc";
import type { StrategyType } from "@shared/types";

export function useLatestDraw() {
  return trpc.bingo.latest.useQuery(undefined, {
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}

export function useDbStats() {
  return trpc.bingo.dbStats.useQuery(undefined, {
    staleTime: 60_000,
  });
}

export function useFrequency(window: number = 20) {
  return trpc.bingo.frequency.useQuery(
    { window },
    { staleTime: 30_000 }
  );
}

export function useConsecutive(window: number = 5) {
  return trpc.bingo.consecutive.useQuery(
    { window },
    { staleTime: 30_000 }
  );
}

export function useRepeatedTriples(window: number = 5) {
  return trpc.bingo.repeatedTriples.useQuery(
    { window },
    { staleTime: 30_000 }
  );
}

export function usePrediction(strategy: StrategyType, pick: number = 5, window: number = 20) {
  return trpc.bingo.predict.useQuery(
    { strategy, pick, window },
    { staleTime: 10_000 }
  );
}

export function useSync() {
  const utils = trpc.useUtils();
  return trpc.bingo.sync.useMutation({
    onSuccess: () => {
      utils.bingo.latest.invalidate();
      utils.bingo.dbStats.invalidate();
      utils.bingo.frequency.invalidate();
      utils.bingo.consecutive.invalidate();
      utils.bingo.history.invalidate();
    },
  });
}

export function useLatestDraws(count: number = 10) {
  return trpc.bingo.history.useQuery(
    { page: 1, pageSize: count },
    { refetchInterval: 60_000, staleTime: 30_000 }
  );
}

export function useHistory(page: number = 1, pageSize: number = 20, date?: string) {
  return trpc.bingo.history.useQuery(
    { page, pageSize, date },
    { staleTime: 30_000 }
  );
}

// ============ AI 一星策略 Hooks ============

export function useAiPredictions(date: string) {
  return trpc.bingo.aiPredictions.useQuery(
    { date },
    { staleTime: 0, refetchInterval: 30_000 }
  );
}

export function useAiHourSlots() {
  return trpc.bingo.aiHourSlots.useQuery(undefined, {
    staleTime: 60_000,
  });
}

export function useAiHourDraws(date: string, hour: string) {
  return trpc.bingo.aiHourDraws.useQuery(
    { date, hour },
    { staleTime: 30_000, enabled: !!date && !!hour }
  );
}

export function useAiFormattedData(date: string, hour: string) {
  return trpc.bingo.aiFormattedData.useQuery(
    { date, hour },
    { staleTime: 30_000, enabled: !!date && !!hour }
  );
}

export function useAiAnalyze() {
  const utils = trpc.useUtils();
  return trpc.bingo.aiAnalyze.useMutation({
    onSuccess: () => {
      utils.bingo.aiPredictions.invalidate();
    },
  });
}

export function useAiManualInput() {
  const utils = trpc.useUtils();
  return trpc.bingo.aiManualInput.useMutation({
    onSuccess: () => {
      utils.bingo.aiPredictions.invalidate();
    },
  });
}
