import { useState, useMemo, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, Zap, Clock, CheckCircle2, XCircle, Pencil, Sparkles, Copy, ClipboardCheck, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAiPredictions,
  useAiHourSlots,
  useAiAnalyze,
  useAiManualInput,
  useAiFormattedData,
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
function GoldenBall({ number, size = "md" }: { number: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses =
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

/** Verification row */
function VerifyRow({ item }: { item: { term: string; index: number; time: string; hits: number[]; missed: number[]; isHit: boolean } }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded text-xs border",
      item.isHit
        ? "border-green-500/30 bg-green-500/5"
        : "border-border/20 bg-transparent"
    )}>
      <span className="font-mono-num text-muted-foreground w-5 text-center shrink-0">[{item.index}]</span>
      <span className="font-mono-num text-muted-foreground w-10 shrink-0">{item.time}</span>
      <div className="flex-1 min-w-0">
        {item.isHit ? (
          <div className="flex items-center gap-1 flex-wrap">
            {item.hits.map(n => (
              <span key={n} className="font-mono-num font-bold text-amber-400">
                {item.hits.length > 1 && "*"}{String(n).padStart(2, "0")}
              </span>
            ))}
            <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
          </div>
        ) : (
          <span className="text-muted-foreground/60">未中獎</span>
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

/** Slot card component — shows one time slot with its prediction status */
function SlotCard({
  slot,
  prediction,
  isCurrent,
  isSelected,
  onSelect,
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

  const longPress = useLongPress(handleCopy, 3000);

  const hitCount = prediction?.verification.filter(v => v.isHit).length ?? 0;
  const totalCount = prediction?.verification.length ?? 0;
  const hitRate = totalCount > 0 ? Math.round((hitCount / totalCount) * 100) : 0;

  return (
    <div
      onClick={onSelect}
      {...longPress.handlers}
      className={cn(
        "relative cursor-pointer rounded border p-1 sm:p-1.5 transition-all select-none",
        isSelected
          ? "border-amber-400/60 bg-amber-400/10 ring-1 ring-amber-400/30"
          : prediction
            ? "border-green-500/20 bg-green-500/5 hover:border-green-500/40"
            : "border-border/20 bg-secondary/20 hover:border-border/40"
      )}
    >
      {/* Long press progress bar */}
      {longPress.pressing && (
        <div className="absolute bottom-0 left-0 h-0.5 bg-amber-400 rounded-b-lg transition-all"
          style={{ width: `${longPress.progress * 100}%` }}
        />
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-0.5">
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
              {hitCount}/{totalCount}
            </span>
          )}
        </div>
      </div>

      {/* Golden balls or empty state */}
      {prediction ? (
        <div className="flex items-center gap-1 justify-center">
          {prediction.goldenBalls.map((n, idx) => (
            <GoldenBall key={idx} number={n} size="sm" />
          ))}
          <span className="text-[9px] text-muted-foreground/50 ml-0.5">
            {prediction.isManual ? "手動" : "AI"}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-center py-0.5">
          <span className="text-[10px] text-muted-foreground/40">尚未分析</span>
        </div>
      )}

      {/* Hint: long press to copy */}
      <p className="text-[7px] text-muted-foreground/25 text-center mt-0">長按複製</p>
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

export default function AiStrategyTab() {
  const todayStr = useMemo(() => getTodayDateStr(), []);
  const [dateStr, setDateStr] = useState(todayStr);
  const isToday = dateStr === todayStr;
  const { data: slotsData } = useAiHourSlots();
  const { data: predictions, isLoading: loadingPredictions } = useAiPredictions(dateStr);
  const aiAnalyze = useAiAnalyze();
  const aiManualInput = useAiManualInput();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [verifySlot, setVerifySlot] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualBalls, setManualBalls] = useState(["", "", ""]);

  const currentSlot = slotsData?.currentSlot;
  const slots = slotsData?.slots || [];

  const effectiveSlot = selectedSlot || currentSlot?.source || "15";
  const currentPrediction = predictions?.find(p => p.sourceHour === effectiveSlot);
  const currentSlotInfo = slots.find(s => s.source === effectiveSlot);

  // Verify slot: default to target of selected source slot
  const effectiveVerifySlot = verifySlot || currentSlotInfo?.target || null;
  // Find prediction whose target matches the verify slot
  const verifyPrediction = effectiveVerifySlot
    ? predictions?.find(p => p.targetHour === effectiveVerifySlot)
    : currentPrediction;

  const handleAiAnalyze = async (sourceHour: string) => {
    try {
      const result = await aiAnalyze.mutateAsync({ date: dateStr, sourceHour });
      toast.success(`AI 分析完成：${result.goldenBalls.map(n => String(n).padStart(2, "0")).join(", ")}`);
    } catch (err: any) {
      toast.error(`AI 分析失敗：${err.message}`);
    }
  };

  const handleManualSubmit = async () => {
    const balls = manualBalls.map(Number).filter(n => n >= 1 && n <= 80);
    if (balls.length !== 3) {
      toast.error("請輸入 3 個 1~80 的號碼");
      return;
    }
    try {
      await aiManualInput.mutateAsync({
        date: dateStr,
        sourceHour: effectiveSlot,
        goldenBalls: balls,
      });
      toast.success("手動輸入成功");
      setManualMode(false);
      setManualBalls(["", "", ""]);
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
            選擇時段 → AI 分析 → 驗證命中 · 長按卡片 3 秒可複製整點數據
          </p>
        </CardContent>
      </Card>

      {/* Time Slot Grid */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-2.5 sm:pt-3 pb-2 sm:pb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-foreground">各時段總覽</span>
            <span className="text-[10px] text-muted-foreground ml-auto">
              {predictions?.length || 0} 個時段已分析
            </span>
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
                  onSelect={() => setSelectedSlot(slot.source)}
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
                {effectiveSlot.padStart(2, "0")}時 三顆黃金球
                {currentPrediction && (
                  <span className="ml-1 text-[10px] text-muted-foreground font-normal">
                    ({currentPrediction.isManual ? "手動" : "AI"})
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setManualMode(!manualMode)}
                className="h-5 gap-0.5 border-amber-500/30 text-[10px] px-1.5 hover:bg-amber-500/10"
              >
                <Pencil className="h-2.5 w-2.5" />
                手動
              </Button>
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
          </div>

          {/* Manual input mode */}
          {manualMode && (
            <div className="flex items-center gap-1.5 mb-2 p-2 rounded-lg bg-secondary/30 border border-border/20">
              {[0, 1, 2].map(i => (
                <Input
                  key={i}
                  type="number"
                  min={1}
                  max={80}
                  placeholder={`球${i + 1}`}
                  value={manualBalls[i]}
                  onChange={e => {
                    const newBalls = [...manualBalls];
                    newBalls[i] = e.target.value;
                    setManualBalls(newBalls);
                  }}
                  className="h-7 w-16 text-center text-xs font-mono-num"
                />
              ))}
              <Button
                size="sm"
                onClick={handleManualSubmit}
                disabled={aiManualInput.isPending}
                className="h-7 text-[10px] px-2 bg-amber-500 hover:bg-amber-600 text-black"
              >
                確認
              </Button>
            </div>
          )}

          {/* Golden balls display */}
          {currentPrediction ? (
            <div className="space-y-1.5">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-secondary/30 border border-amber-500/20">
                  {currentPrediction.goldenBalls.map((num, idx) => (
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
                尚未分析此時段，點擊「AI分析」或「手動」輸入
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Section — with time slot selector */}
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
                  {verifyPrediction.goldenBalls.map(n => (
                    <GoldenBall key={n} number={n} size="sm" />
                  ))}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  命中 <span className="font-mono-num font-bold text-green-400">
                    {verifyPrediction.verification.filter(v => v.isHit).length}
                  </span>/{verifyPrediction.verification.length} 期
                </span>
              </div>
              <div className="space-y-0.5">
                {verifyPrediction.verification.map(item => (
                  <VerifyRow key={item.term} item={item} />
                ))}
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-border/20 flex items-center justify-center gap-3 text-[10px]">
                <span className="text-green-400">
                  命中率：{Math.round((verifyPrediction.verification.filter(v => v.isHit).length / verifyPrediction.verification.length) * 100)}%
                </span>
                <span className="text-muted-foreground">
                  總命中球數：{verifyPrediction.verification.reduce((sum, v) => sum + v.hits.length, 0)}
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
