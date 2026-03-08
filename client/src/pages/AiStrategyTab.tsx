import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, Zap, Clock, CheckCircle2, XCircle, Pencil, Copy, ClipboardCheck, ChevronLeft, ChevronRight, CalendarDays, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAiPredictions,
  useAiHourSlots,
  useAiAnalyze,
  useAiManualInput,
  useAiFormattedData,
  useAiDeletePrediction,
  useAiHourDraws,
} from "@/hooks/useBingo";
import { toast } from "sonner";

/** Get today's date in YYYY-MM-DD format (UTC+8), but if current time is before 07:00 use yesterday */
function getTodayDateStr(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hour = utc8.getUTCHours();
  if (hour < 7) {
    utc8.setUTCDate(utc8.getUTCDate() - 1);
  }
  return utc8.toISOString().split("T")[0];
}

/** Golden ball component */
function GoldenBall({ number, size = "md" }: { number: number; size?: "xs" | "sm" | "md" | "lg" }) {
  const sizeClasses =
    size === "xs" ? "w-3.5 h-3.5 text-[6px]" :
    size === "sm" ? "w-5 h-5 text-[8px]" :
    size === "lg" ? "w-10 h-10 sm:w-11 sm:h-11 text-sm sm:text-base" :
    "w-8 h-8 sm:w-9 sm:h-9 text-xs sm:text-sm";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-mono-num font-bold text-white shrink-0",
        sizeClasses
      )}
      style={{
        background: "radial-gradient(circle at 35% 35%, #fbbf24, #f59e0b, #d97706)",
        boxShadow: "0 0 14px rgba(245, 158, 11, 0.55), 0 0 5px rgba(245, 158, 11, 0.3)",
      }}
    >
      {String(number).padStart(2, "0")}
    </div>
  );
}

/** Number Distribution Block — shows 15 draws for the target hour, 01~80 columns, horizontal scroll */
function NumberDistributionBlock({
  dateStr,
  targetHour,
  goldenBalls,
}: {
  dateStr: string;
  targetHour: string | null;
  goldenBalls?: number[];
}) {
  const { data: draws, isLoading } = useAiHourDraws(
    dateStr,
    targetHour ?? "",
  );

  if (!targetHour) return null;

  // Use the 15 draws directly from the API (already sorted by term)
  const displayDraws = draws || [];
  const hourPad = targetHour.padStart(2, "0");
  const goldenSet = new Set(goldenBalls ?? []);

  const NUMS = Array.from({ length: 80 }, (_, i) => i + 1);

  return (
    <Card className="neon-border bg-card">
      <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-medium text-foreground">即時數字分布</span>
          <span className="text-[10px] text-muted-foreground">{hourPad}時 近15期</span>
          <div className="ml-auto flex items-center gap-2 text-[9px]">
            <span className="flex items-center gap-0.5">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-600/70"></span>
              <span className="text-muted-foreground">開出</span>
            </span>
            <span className="flex items-center gap-0.5">
              <span className="inline-block w-2 h-2 rounded-sm bg-emerald-400 ring-1 ring-emerald-300"></span>
              <span className="text-muted-foreground">預測球</span>
            </span>
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <table className="border-collapse" style={{ minWidth: `${80 * 13 + 20}px`, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card text-[6px] text-muted-foreground/60 font-normal px-0 py-0.5 text-right border-r border-white/20 min-w-[20px]">時</th>
                  {NUMS.map(n => (
                    <th
                      key={n}
                      className={cn(
                        "text-[7px] font-mono-num font-normal text-center px-0 py-0.5 w-[13px] min-w-[13px] border-r border-b border-white/10",
                        goldenSet.has(n) ? "text-emerald-400 font-bold" : "text-muted-foreground/40"
                      )}
                    >
                      {String(n).padStart(2, "0")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...displayDraws].reverse().map((draw) => {
                  const hasDraw = !draw.pending;
                  const isPending = draw.pending ?? false;
                  return (
                    <tr key={draw.term || draw.time} className={cn("border-t border-white/10", isPending && "opacity-50")}>
                      <td className={cn("sticky left-0 z-10 bg-card text-[6px] font-mono-num px-0 py-0.5 text-right border-r border-white/20 whitespace-nowrap", isPending ? "text-muted-foreground/30" : "text-muted-foreground/60")}>
                        {draw.time || "-"}
                      </td>
                      {NUMS.map(n => {
                        const isDrawn = hasDraw && new Set(draw.numbers).has(n);
                        const isGolden = goldenSet.has(n);
                        return (
                          <td key={n} className="text-center p-0 w-[13px] border-r border-b border-white/10">
                            {isDrawn ? (
                              <div
                                className={cn(
                                  "mx-auto my-0.5",
                                  "w-2 h-2",
                                  isGolden
                                    ? "bg-emerald-400 ring-1 ring-emerald-300 shadow-[0_0_4px_rgba(52,211,153,0.8)]"
                                    : "bg-emerald-600/70"
                                )}
                              />
                            ) : (
                              <div className="mx-auto my-0.5 w-2 h-2" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/** Verification row — horizontal layout */
function VerifyRow({ item }: { item: { term: string; index: number; time: string; hits: number[]; missed: number[]; isHit: boolean; pending?: boolean } }) {
  if (item.pending) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border border-border/10 bg-transparent opacity-40">
        {/* 序號 */}
        <span className="font-mono-num text-muted-foreground/50 text-[9px] shrink-0 w-4 text-right">[{item.index}]</span>
        {/* 時間 */}
        <span className="font-mono-num text-muted-foreground/50 text-[9px] shrink-0 w-9">{item.time}</span>
        {/* 等待開獎 */}
        <span className="text-[9px] text-muted-foreground/40 italic">等待開獎...</span>
      </div>
    );
  }
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded text-xs border",
      item.isHit
        ? "border-green-500/30 bg-green-500/5"
        : "border-border/20 bg-transparent"
    )}>
      {/* 序號 */}
      <span className="font-mono-num text-muted-foreground/40 text-[9px] shrink-0 w-4 text-right">[{item.index}]</span>
      {/* 時間 */}
      <span className="font-mono-num text-muted-foreground/60 text-[9px] shrink-0 w-9">{item.time}</span>
      {/* 期數 */}
      <span className="font-mono-num text-muted-foreground/40 text-[9px] shrink-0">{item.term}</span>
      {/* 命中結果 */}
      <div className="flex-1 flex items-center gap-1 min-w-0">
        {item.isHit ? (
          <>
            {item.hits.map(n => (
              <span key={n} className="font-mono-num font-bold text-amber-400 text-[10px]">
                {item.hits.length > 1 ? `*${String(n).padStart(2, "0")}` : String(n).padStart(2, "0")}
              </span>
            ))}
            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
          </>
        ) : (
          <span className="text-muted-foreground/50 text-[9px]">未中獎</span>
        )}
      </div>
    </div>
  );
}

/** Long press hook */
function useLongPress(callback: () => void, ms: number = 3000) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setPressing(true);
    setProgress(0);
    const startTime = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min(elapsed / ms, 1));
    }, 50);
    timerRef.current = setTimeout(() => {
      callback();
      setPressing(false);
      setProgress(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, ms);
  }, [callback, ms]);

  const stop = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPressing(false);
    setProgress(0);
  }, []);

  return {
    pressing,
    progress,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    },
  };
}

/** Slot card component */
function SlotCard({
  slot,
  prediction,
  isCurrent,
  isSelected,
  onSelect,
  onDelete,
  dateStr,
}: {
  slot: { source: string; target: string; label: string; draws: number };
  prediction?: {
    goldenBalls: number[];
    reasoning: string | null;
    isManual: boolean;
    verification: { isHit: boolean; hits: number[] }[];
  };
  isCurrent: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onDelete?: () => void;
  dateStr: string;
}) {
  const [copied, setCopied] = useState(false);
  const { data: formattedData } = useAiFormattedData(dateStr, slot.source);

  const handleCopy = useCallback(() => {
    if (formattedData?.text) {
      navigator.clipboard.writeText(formattedData.text).then(() => {
        setCopied(true);
        toast.success(`已複製 ${slot.source} 時段數據`);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      toast.error("此時段尚無數據可複製");
    }
  }, [formattedData, slot.source]);

  const longPress = useLongPress(handleCopy, 300);

  const hitCount = prediction?.verification.filter(v => v.isHit).length ?? 0;
  const totalCount = prediction?.verification.length ?? 0;
  const FIXED_TOTAL = 12; // 固定分母為 12 期
  const hitRate = totalCount > 0 ? Math.round((hitCount / FIXED_TOTAL) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      {...longPress.handlers}
      className={cn(
        "relative cursor-pointer rounded border p-0.5 sm:p-1 transition-all select-none",
        isSelected
          ? "border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/30"
          : prediction
            ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40"
            : "border-border/20 bg-secondary/20 hover:border-border/40"
      )}
    >
      {longPress.pressing && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 rounded-b-lg transition-all"
          style={{ width: `${longPress.progress * 100}%` }}
        />
      )}
      <div className="flex items-center justify-between mb-0.25">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-mono-num text-[10px] font-medium text-foreground">
            {slot.source.padStart(2, "0")}時
          </span>
          {isCurrent && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-1">
          {prediction && onDelete && (
            <button
              onClick={e => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-3.5 w-3.5 flex items-center justify-center rounded hover:bg-red-500/20 text-muted-foreground/30 hover:text-red-400 transition-colors"
              title="清除球號"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
          {copied ? (
            <ClipboardCheck className="h-3 w-3 text-green-400" />
          ) : (
            <Copy className="h-3 w-3 text-muted-foreground/40" />
          )}
          {prediction && (
            <span className={cn(
              "text-[10px] font-mono-num",
              hitRate >= 50 ? "text-green-400" : hitRate > 0 ? "text-amber-400" : "text-muted-foreground"
            )}>
              {hitCount}/{FIXED_TOTAL}
            </span>
          )}
        </div>
      </div>
      {prediction ? (
        <div className="flex items-center gap-1 justify-center">
          {prediction.goldenBalls.map((n, idx) => (
            <GoldenBall key={idx} number={n} size="xs" />
          ))}
          <span className="text-[7px] text-muted-foreground/50 ml-0.5">
            {prediction.isManual ? "手動" : "AI"}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center py-0.5">
          <span className="text-[10px] text-muted-foreground/40">尚未分析</span>
        </div>
      )}
      <p className="text-[6px] text-muted-foreground/20 text-center mt-0.5">長押複製</p>
    </div>
  );
}

/** Format YYYY-MM-DD to display string like "03/07 (五)" */
function formatDateDisplay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd} (${weekdays[d.getDay()]})`;
}

/** Shift date by N days */
function shiftDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

/**
 * Parse input text to extract numbers 1~80.
 * Supports formats like:
 * - "10 22 33 55 88 99"
 * - "整點 10 22 33 55 88 99"
 * - "10,22,33"
 * - Any text with numbers mixed in — extracts only valid 1~80 numbers
 */
function parseNumbersFromText(text: string): number[] {
  // Extract all number sequences from the text
  const matches = text.match(/\d+/g);
  if (!matches) return [];
  // Filter to valid bingo numbers (1~80), deduplicate
  const seen = new Set<number>();
  const result: number[] = [];
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (n >= 1 && n <= 80 && !seen.has(n)) {
      seen.add(n);
      result.push(n);
    }
  }
  return result.slice(0, 6); // Max 6
}

export default function AiStrategyTab() {
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [dateStr, setDateStr] = useState(todayStr);
  const isToday = dateStr === todayStr;
  const { data: slotsData } = useAiHourSlots();
  const { data: predictions, isLoading: loadingPredictions } = useAiPredictions(dateStr);
  const aiAnalyze = useAiAnalyze();
  const aiManualInput = useAiManualInput();
  const aiDeletePrediction = useAiDeletePrediction();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [verifySlot, setVerifySlot] = useState<string | null>(null);
  // Manual input state
  const [manualText, setManualText] = useState("");
  const [parsedBalls, setParsedBalls] = useState<number[]>([]);

  const currentSlot = slotsData?.currentSlot;
  const slots = slotsData?.slots || [];

  const effectiveSlot = selectedSlot || currentSlot?.source || "15";
  const currentPrediction = predictions?.find(p => p.sourceHour === effectiveSlot);
  const currentSlotInfo = slots.find(s => s.source === effectiveSlot);

  const effectiveVerifySlot = verifySlot || currentSlotInfo?.target || null;
  const verifyPrediction = effectiveVerifySlot
    ? predictions?.find(p => p.targetHour === effectiveVerifySlot)
    : currentPrediction;

  const handleAiAnalyze = async (sourceHour: string) => {
    try {
      const result = await aiAnalyze.mutateAsync({ date: dateStr, sourceHour });
      toast.success(`AI 分析完成：${result.goldenBalls.map((n: number) => String(n).padStart(2, "0")).join(", ")}`);
    } catch (err: any) {
      toast.error(`AI 分析失敗：${err.message}`);
    }
  };

  // Handle manual text input change — auto parse numbers
  const handleManualTextChange = (text: string) => {
    setManualText(text);
    setParsedBalls(parseNumbersFromText(text));
  };

  const handleManualSubmit = async () => {
    if (parsedBalls.length < 1 || parsedBalls.length > 6) {
      toast.error("請輸入 1~6 個 1~80 的號碼");
      return;
    }
    try {
      await aiManualInput.mutateAsync({
        date: dateStr,
        sourceHour: effectiveSlot,
        goldenBalls: parsedBalls,
      });
      toast.success("手動輸入成功");
      setManualText("");
      setParsedBalls([]);
    } catch (err: any) {
      toast.error(`輸入失敗：${err.message}`);
    }
  };

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Header */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground">AI 一星策略</span>
            </div>
            {/* Date Selector */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setDateStr(prev => shiftDate(prev, -1))}
                className="p-0.5 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary/40 border border-border/20 min-w-[80px] justify-center">
                <CalendarDays className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-mono-num text-foreground">
                  {formatDateDisplay(dateStr)}
                </span>
              </div>
              <button
                onClick={() => {
                  if (!isToday) setDateStr(prev => shiftDate(prev, 1));
                }}
                disabled={isToday}
                className={cn(
                  "p-0.5 rounded transition-colors",
                  isToday
                    ? "text-muted-foreground/20 cursor-not-allowed"
                    : "hover:bg-white/10 text-muted-foreground hover:text-foreground"
                )}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
              {!isToday && (
                <button
                  onClick={() => setDateStr(todayStr)}
                  className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 transition-colors"
                >
                  今日
                </button>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            選擇時段 → AI 分析 → 驗證命中 · 長按卡片 1 秒可複製整點數據
          </p>
        </CardContent>
      </Card>

      {/* Time Slot Grid */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-xs font-medium text-foreground shrink-0">各時段總覽</span>
            <span className="text-[10px] text-muted-foreground">
              {predictions?.length || 0} 個已分析
            </span>
            {predictions && predictions.length > 0 && (
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={() => {
                    window.open('https://gemini.google.com/app/a35bb8c4886f6949', '_blank');
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 hover:border-amber-500/40 transition-colors shrink-0"
                >
                  <Brain className="h-3 w-3" />
                  <span>AI手動計算</span>
                </button>
                <button
                  onClick={async () => {
                    if (!window.confirm(`確定清除 ${dateStr} 所有時段的球號？`)) return;
                    try {
                      await Promise.all(
                        predictions.map(pred =>
                          aiDeletePrediction.mutateAsync({ date: dateStr, sourceHour: pred.sourceHour })
                        )
                      );
                      toast.success(`已清除所有時段球號`);
                    } catch (err: any) {
                      toast.error(`清除失敗：${err.message}`);
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-colors shrink-0"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>清除全部</span>
                </button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {slots.map(slot => {
              const pred = predictions?.find(p => p.sourceHour === slot.source);
              const isCurrent = currentSlot?.source === slot.source;
              const isSelected = effectiveSlot === slot.source;
              return (
                <SlotCard
                  key={slot.source}
                  slot={slot}
                  prediction={pred}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  onSelect={() => {
                    setSelectedSlot(slot.source);
                    // 同時更新 verifySlot 為該時段的目標時段，確保數字分布不消失
                    setVerifySlot(slot.target);
                  }}
                  onDelete={pred ? async () => {
                    try {
                      await aiDeletePrediction.mutateAsync({ date: dateStr, sourceHour: slot.source });
                      toast.success(`已清除 ${slot.source.padStart(2, "0")}時段球號`);
                    } catch (err: any) {
                      toast.error(`清除失敗：${err.message}`);
                    }
                  } : undefined}
                  dateStr={dateStr}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Slot Detail — AI Analysis / Golden Balls */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground">
                {effectiveSlot.padStart(2, "0")}時 黃金球
                {currentPrediction && (
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                    ({currentPrediction.isManual ? "手動" : "AI"} · {currentPrediction.goldenBalls.length}顆)
                  </span>
                )}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAiAnalyze(effectiveSlot)}
              disabled={aiAnalyze.isPending}
              className="h-5 gap-0.5 border-amber-500/30 text-[10px] px-1.5 hover:bg-amber-500/10"
            >
              {aiAnalyze.isPending ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <Brain className="h-2.5 w-2.5" />
              )}
              AI分析
            </Button>
          </div>

          {/* Golden balls display */}
          {currentPrediction ? (
            <div className="space-y-1.5">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-secondary/30 border border-amber-500/20">
                  {currentPrediction.goldenBalls.map((num: number, idx: number) => (
                    <GoldenBall key={idx} number={num} size="lg" />
                  ))}
                </div>
              </div>
              {currentPrediction.reasoning && (
                <p className="text-[10px] text-muted-foreground/70 text-center px-2">
                  {currentPrediction.reasoning}
                </p>
              )}
              <p className="text-[10px] text-muted-foreground/50 text-center">
                分析 {effectiveSlot.padStart(2, "0")}:00~{effectiveSlot.padStart(2, "0")}:55 → 預測 {currentSlotInfo?.target.padStart(2, "0") || "??"}:00~{currentSlotInfo?.target.padStart(2, "0") || "??"}:55
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-3">
              <p className="text-[10px] text-muted-foreground">
                尚未分析此時段，點擊「AI分析」或在下方手動輸入
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Input — Independent Card */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Pencil className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-foreground">
              手動輸入（{effectiveSlot.padStart(2, "0")}時）
            </span>
            <span className="text-[10px] text-muted-foreground ml-auto">1~6 顆球</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Input
              type="text"
              placeholder="輸入號碼，例如：10 22 33 55 88 99"
              value={manualText}
              onChange={e => handleManualTextChange(e.target.value)}
              className="h-7 text-xs font-mono-num flex-1"
            />
            <Button
              size="sm"
              onClick={handleManualSubmit}
              disabled={aiManualInput.isPending || parsedBalls.length < 1}
              className="h-7 text-[10px] px-2.5 bg-amber-500 hover:bg-amber-600 text-black shrink-0"
            >
              {aiManualInput.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "驗證"
              )}
            </Button>
          </div>

          {/* Parsed preview */}
          {parsedBalls.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground shrink-0">解析：</span>
              <div className="flex items-center gap-1 flex-wrap">
                {parsedBalls.map((n, idx) => (
                  <GoldenBall key={idx} number={n} size="sm" />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                {parsedBalls.length} 顆
              </span>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/40 mt-1">
            支援格式：直接數字、逗號分隔、或含文字（自動去除文字保留數字）
          </p>
        </CardContent>
      </Card>

      {/* Number Distribution Block */}
      <NumberDistributionBlock
        dateStr={dateStr}
        targetHour={effectiveVerifySlot}
        goldenBalls={verifyPrediction?.goldenBalls}
      />

      {/* Verification Section */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-medium text-foreground">驗證結果</span>
            </div>
          </div>

          {/* Verify time slot selector */}
          <div className="mb-2">
            <p className="text-[10px] text-muted-foreground mb-1">選擇驗證時段：</p>
            <div className="flex gap-0 overflow-x-auto scrollbar-none border-b border-border/20">
              {slots.map(slot => {
                const pred = predictions?.find(p => p.targetHour === slot.target);
                const isVerifySelected = effectiveVerifySlot === slot.target;
                return (
                  <button
                    key={slot.target}
                    onClick={() => setVerifySlot(slot.target)}
                    disabled={!pred}
                    className={cn(
                      "shrink-0 py-1 px-1.5 text-center text-[10px] font-mono-num transition-all border-b-2",
                      isVerifySelected
                        ? "border-green-400 text-green-400 bg-green-400/10"
                        : pred
                          ? "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                          : "border-transparent text-muted-foreground/30 cursor-not-allowed"
                    )}
                  >
                    {slot.target.padStart(2, "0")}時
                  </button>
                );
              })}
            </div>
          </div>

          {/* Verification results */}
          {verifyPrediction && verifyPrediction.verification.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground">號碼：</span>
                  {verifyPrediction.goldenBalls.map((n: number) => (
                    <GoldenBall key={n} number={n} size="sm" />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">
                    命中 <span className="font-mono-num font-bold text-green-400">
                      {verifyPrediction.verification.filter((v: any) => v.isHit).length}
                    </span>/12 期
                  </span>
                  {/* 複製整個驗證結果按鈕 */}
                  <button
                    onClick={() => {
                      const hitCount = verifyPrediction.verification.filter((v: any) => v.isHit).length;
                      const balls = verifyPrediction.goldenBalls.map((n: number) => String(n).padStart(2, "0")).join(" ");
                      const lines = verifyPrediction.verification.map((v: any) => {
                        if (v.pending) return `[${v.index}] ${v.time} 等待開獎`;
                        const hitStr = v.isHit ? v.hits.map((n: number) => (v.hits.length > 1 ? `*${String(n).padStart(2,"0")}` : String(n).padStart(2,"0"))).join(" ") + " ✅" : "未中獎";
                        return `[${v.term}][${v.index}] ${v.time} | ${hitStr}`;
                      }).join("\n");
                      const text = `驗證結果 號碼：${balls}\n命中 ${hitCount}/12 期（命中率：${Math.round(hitCount/12*100)}%）\n\n${lines}`;
                      navigator.clipboard.writeText(text).then(() => toast.success("驗證結果已複製"));
                    }}
                    className="flex items-center gap-0.5 text-[9px] text-muted-foreground/60 hover:text-amber-400 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    <span>複製</span>
                  </button>
                </div>
              </div>
              <div className="space-y-0.5">
                {verifyPrediction.verification.map((item: any, idx: number) => (
                  <VerifyRow key={item.term || `pending-${idx}`} item={item} />
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-border/20 flex items-center justify-center gap-3 text-[10px]">
                <span className="text-green-400">
                  命中率：{Math.round((verifyPrediction.verification.filter((v: any) => v.isHit).length / 12) * 100)}%
                </span>
                <span className="text-muted-foreground">
                  總命中球數：{verifyPrediction.verification.reduce((sum: number, v: any) => sum + v.hits.length, 0)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 py-3">
              <XCircle className="h-4 w-4 text-muted-foreground/30" />
              <p className="text-[10px] text-muted-foreground/50">
                {effectiveVerifySlot
                  ? `${effectiveVerifySlot.padStart(2, "0")} 時段尚無預測資料或開獎資料`
                  : "請先選擇驗證時段"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
