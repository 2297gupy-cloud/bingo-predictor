import { useState } from "react";
import { usePrediction } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, Target, Snowflake, Scale, Shuffle, Clock, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StrategyType } from "@shared/types";
import { STRATEGY_LABELS, STRATEGY_DESCRIPTIONS } from "@shared/types";

const strategyIcons: Record<StrategyType, React.ReactNode> = {
  hot: <Target className="h-4 w-4" />,
  cold: <Snowflake className="h-4 w-4" />,
  balanced: <Scale className="h-4 w-4" />,
  weighted: <Shuffle className="h-4 w-4" />,
  overdue: <Clock className="h-4 w-4" />,
};

const strategyColors: Record<StrategyType, string> = {
  hot: "border-neon-orange/40 hover:border-neon-orange/70 data-[active=true]:border-neon-orange data-[active=true]:bg-neon-orange/10 data-[active=true]:text-neon-orange",
  cold: "border-neon-blue/40 hover:border-neon-blue/70 data-[active=true]:border-neon-blue data-[active=true]:bg-neon-blue/10 data-[active=true]:text-neon-blue",
  balanced: "border-neon-green/40 hover:border-neon-green/70 data-[active=true]:border-neon-green data-[active=true]:bg-neon-green/10 data-[active=true]:text-neon-green",
  weighted: "border-neon-purple/40 hover:border-neon-purple/70 data-[active=true]:border-neon-purple data-[active=true]:bg-neon-purple/10 data-[active=true]:text-neon-purple",
  overdue: "border-neon-yellow/40 hover:border-neon-yellow/70 data-[active=true]:border-neon-yellow data-[active=true]:bg-neon-yellow/10 data-[active=true]:text-neon-yellow",
};

const WINDOW_OPTIONS = [1, 2, 3, 5, 10, 15, 20] as const;
const PICK_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

/** 預測結果號碼球 — 紅色明亮漸層球體（參考重複號碼樣式） */
function PredictBall({ number, delay }: { number: number; delay: number }) {
  return (
    <div
      className="flex items-center justify-center w-12 h-12 rounded-full font-mono-num text-base font-bold text-white animate-float"
      style={{
        background: "radial-gradient(circle at 35% 35%, #ff6b6b, #e53e3e, #c53030)",
        boxShadow: "0 0 14px rgba(239, 68, 68, 0.55), 0 0 5px rgba(239, 68, 68, 0.3)",
        animationDelay: `${delay}s`,
      }}
    >
      {String(number).padStart(2, "0")}
    </div>
  );
}

export default function PredictTab() {
  const [strategy, setStrategy] = useState<StrategyType>("balanced");
  const [pick, setPick] = useState(5);
  const [window, setWindow] = useState(20);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, refetch } = usePrediction(strategy, pick, window);

  const handleRegenerate = () => {
    setRefreshKey(k => k + 1);
    refetch();
  };

  return (
    <div className="space-y-4">
      {/* Window Period Selection */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neon-blue" />
              <span className="text-sm font-medium text-foreground">分析區間</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span>分析最近</span>
              <span className="font-mono-num font-bold text-neon-orange">{window}</span>
              <span>期</span>
            </div>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {WINDOW_OPTIONS.map(w => (
              <button
                key={w}
                onClick={() => setWindow(w)}
                className={cn(
                  "relative flex-1 min-w-[3rem] rounded-lg border px-2 py-2 text-center text-sm font-mono-num font-medium transition-all",
                  window === w
                    ? "border-neon-orange/60 bg-neon-orange/15 text-neon-orange shadow-[0_0_8px_rgba(255,160,50,0.2)]"
                    : "border-border/50 text-muted-foreground hover:border-neon-orange/40 hover:text-foreground hover:bg-neon-orange/5"
                )}
              >
                {w}
                <span className="text-[10px] ml-0.5 opacity-70">期</span>
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground/60">
            選擇較少期數可觀察近期趨勢，較多期數可分析長期分布
          </p>
        </CardContent>
      </Card>

      {/* Strategy Selection */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Sparkles className="h-4 w-4 text-neon-purple" />
            選擇預測策略
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(Object.keys(STRATEGY_LABELS) as StrategyType[]).map(s => (
              <button
                key={s}
                data-active={strategy === s}
                onClick={() => setStrategy(s)}
                className={cn(
                  "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                  "text-muted-foreground",
                  strategyColors[s]
                )}
              >
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  {strategyIcons[s]}
                  {STRATEGY_LABELS[s]}
                </div>
                <span className="text-[11px] opacity-70">{STRATEGY_DESCRIPTIONS[s]}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pick Count - Ball Selector */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">選取號碼數</span>
            <span className="text-sm text-muted-foreground">
              已選 <span className="font-mono-num font-bold text-amber-400">{pick}</span> 個號碼
            </span>
          </div>
          <div className="grid grid-cols-10 gap-2 w-full">
            {PICK_OPTIONS.map(n => (
              <button
                key={n}
                onClick={() => setPick(n)}
                className={cn(
                  "relative flex items-center justify-center rounded-full aspect-square text-sm font-mono-num font-bold transition-all duration-200",
                  pick === n
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)] scale-110"
                    : "bg-secondary/80 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-300 hover:scale-105"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground/60 text-center">
            賓果賓果每期開出 20 個號碼，建議選取 1~10 個號碼，選越多覆蓋率越高但彩金分配不同
          </p>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-display">預測結果</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isLoading}
              className="h-7 gap-1 border-neon-purple/30 text-xs hover:bg-neon-purple/10"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Sparkles className="h-3 w-3" />
              )}
              重新預測
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
            </div>
          ) : data ? (
            <div className="space-y-4">
              {/* 策略說明 */}
              <p className="text-sm text-muted-foreground text-center">{data.description}</p>

              {/* 預測號碼球體 — 紅色明亮漸層，整體置中縮排 */}
              <div className="flex justify-center">
                <div className="inline-flex flex-wrap justify-center gap-3 px-4 py-4 rounded-xl bg-secondary/30 border border-border/20">
                  {data.numbers.map((num, idx) => (
                    <PredictBall
                      key={`${num}-${refreshKey}-${idx}`}
                      number={num}
                      delay={idx * 0.12}
                    />
                  ))}
                </div>
              </div>

              {/* 底部資訊 */}
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground/60">
                <span>
                  策略：<span className="text-foreground/70">{STRATEGY_LABELS[data.strategy as StrategyType]}</span>
                </span>
                <span className="text-border">|</span>
                <span>
                  分析：<span className="font-mono-num text-foreground/70">{window}</span> 期
                </span>
                <span className="text-border">|</span>
                <span>
                  選號：<span className="font-mono-num text-foreground/70">{pick}</span> 個
                </span>
              </div>
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              尚無資料，請先同步開獎資料
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
