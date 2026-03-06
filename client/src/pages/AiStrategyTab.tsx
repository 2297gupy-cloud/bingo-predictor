import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Brain, Zap, Clock, CheckCircle2, XCircle, Pencil, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useAiPredictions,
  useAiHourSlots,
  useAiAnalyze,
  useAiManualInput,
} from "@/hooks/useBingo";
import { toast } from "sonner";

/** Get today's date in YYYY-MM-DD format (UTC+8), but if current time is before 07:00 use yesterday */
function getTodayDateStr(): string {
  const now = new Date();
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const hour = utc8.getUTCHours();
  // Bingo draws start at 07:05, so before 07:00 we use yesterday's date
  if (hour < 7) {
    utc8.setUTCDate(utc8.getUTCDate() - 1);
  }
  return utc8.toISOString().split("T")[0];
}

/** Golden ball component */
function GoldenBall({ number, size = "md" }: { number: number; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-7 h-7 text-[10px]" : "w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm";
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-mono-num font-bold text-white",
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

export default function AiStrategyTab() {
  const dateStr = useMemo(() => getTodayDateStr(), []);
  const { data: slotsData } = useAiHourSlots();
  const { data: predictions, isLoading: loadingPredictions } = useAiPredictions(dateStr);
  const aiAnalyze = useAiAnalyze();
  const aiManualInput = useAiManualInput();

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualBalls, setManualBalls] = useState(["", "", ""]);

  // Current time info
  const currentSlot = slotsData?.currentSlot;
  const slots = slotsData?.slots || [];

  // Get prediction for selected slot
  const selectedPrediction = predictions?.find(p => p.sourceHour === selectedSlot);

  // Auto-select current slot
  const effectiveSlot = selectedSlot || currentSlot?.source || "15";

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

  // Find prediction for current effective slot
  const currentPrediction = predictions?.find(p => p.sourceHour === effectiveSlot);
  const currentSlotInfo = slots.find(s => s.source === effectiveSlot);

  return (
    <div className="space-y-1.5 sm:space-y-2">
      {/* Header */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-3 sm:pt-3.5 pb-2.5 sm:pb-3">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Brain className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground">AI 一星策略</span>
            </div>
            <span className="text-[10px] text-muted-foreground">
              Gemini AI 分析 · 整點三顆黃金球
            </span>
          </div>

          {/* Hour slot selector */}
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            {slots.map(slot => {
              const hasPrediction = predictions?.some(p => p.sourceHour === slot.source);
              const isCurrent = currentSlot?.source === slot.source;
              const isSelected = effectiveSlot === slot.source;
              return (
                <button
                  key={slot.source}
                  onClick={() => setSelectedSlot(slot.source)}
                  className={cn(
                    "relative shrink-0 py-1.5 px-2 text-center text-[10px] font-mono-num transition-all border-b-2",
                    isSelected
                      ? "border-amber-400 text-amber-400 bg-amber-400/10"
                      : hasPrediction
                        ? "border-transparent text-green-400/70 hover:text-green-400 hover:bg-green-400/5"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {slot.source}時
                  {isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                  {hasPrediction && !isSelected && (
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground/60">
            分析 {effectiveSlot.padStart(2, "0")}:00~{effectiveSlot.padStart(2, "0")}:55 數據 → 預測 {currentSlotInfo?.target.padStart(2, "0") || "??"}:00~{currentSlotInfo?.target.padStart(2, "0") || "??"}:55
          </p>
        </CardContent>
      </Card>

      {/* AI Analysis / Golden Balls */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-3 sm:pt-3.5 pb-2.5 sm:pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground">
                三顆黃金球
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
                <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-secondary/30 border border-amber-500/20">
                  {currentPrediction.goldenBalls.map((num, idx) => (
                    <GoldenBall key={idx} number={num} />
                  ))}
                </div>
              </div>
              {currentPrediction.reasoning && (
                <p className="text-[10px] text-muted-foreground/70 text-center px-2">
                  {currentPrediction.reasoning}
                </p>
              )}
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

      {/* Verification Results */}
      {currentPrediction && currentPrediction.verification.length > 0 && (
        <Card className="neon-border bg-card">
          <CardContent className="pt-3 sm:pt-3.5 pb-2.5 sm:pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                <span className="text-xs font-medium text-foreground">
                  驗證結果 ({currentSlotInfo?.target.padStart(2, "0")}:00~{currentSlotInfo?.target.padStart(2, "0")}:55)
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                命中 <span className="font-mono-num font-bold text-green-400">
                  {currentPrediction.verification.filter(v => v.isHit).length}
                </span>/{currentPrediction.verification.length} 期
              </span>
            </div>
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              <span className="text-[10px] text-muted-foreground">號碼：</span>
              {currentPrediction.goldenBalls.map(n => (
                <GoldenBall key={n} number={n} size="sm" />
              ))}
            </div>
            <div className="space-y-0.5">
              {currentPrediction.verification.map(item => (
                <VerifyRow key={item.term} item={item} />
              ))}
            </div>
            {/* Summary */}
            <div className="mt-1.5 pt-1.5 border-t border-border/20 flex items-center justify-center gap-3 text-[10px]">
              <span className="text-green-400">
                命中率：{Math.round((currentPrediction.verification.filter(v => v.isHit).length / currentPrediction.verification.length) * 100)}%
              </span>
              <span className="text-muted-foreground">
                總命中球數：{currentPrediction.verification.reduce((sum, v) => sum + v.hits.length, 0)}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All predictions summary */}
      {predictions && predictions.length > 0 && (
        <Card className="neon-border bg-card">
          <CardContent className="pt-3 sm:pt-3.5 pb-2.5 sm:pb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs font-medium text-foreground">今日 AI 預測總覽</span>
            </div>
            <div className="space-y-0.5">
              {predictions.map(pred => {
                const hitCount = pred.verification.filter(v => v.isHit).length;
                const totalCount = pred.verification.length;
                const hitRate = totalCount > 0 ? Math.round((hitCount / totalCount) * 100) : 0;
                return (
                  <button
                    key={pred.id}
                    onClick={() => setSelectedSlot(pred.sourceHour)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1 rounded text-xs transition-all",
                      effectiveSlot === pred.sourceHour
                        ? "bg-amber-500/10 border border-amber-500/30"
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <span className="font-mono-num text-muted-foreground w-8 shrink-0">
                      {pred.sourceHour.padStart(2, "0")}時
                    </span>
                    <div className="flex items-center gap-1">
                      {pred.goldenBalls.map(n => (
                        <span key={n} className="font-mono-num font-bold text-amber-400 text-[10px]">
                          {String(n).padStart(2, "0")}
                        </span>
                      ))}
                    </div>
                    <span className="flex-1" />
                    {totalCount > 0 && (
                      <span className={cn(
                        "font-mono-num text-[10px]",
                        hitRate >= 50 ? "text-green-400" : hitRate > 0 ? "text-amber-400" : "text-muted-foreground"
                      )}>
                        {hitCount}/{totalCount} ({hitRate}%)
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/50">
                      {pred.isManual ? "手動" : "AI"}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
