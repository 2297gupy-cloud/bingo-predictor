import { useState, useMemo } from "react";
import BingoBall from "@/components/BingoBall";
import { usePrediction } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
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

  const ballVariant = useMemo(() => {
    switch (strategy) {
      case "hot": return "hot" as const;
      case "cold": return "cold" as const;
      default: return "special" as const;
    }
  }, [strategy]);

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
              <span className="font-mono-num font-bold text-neon-blue">{window}</span>
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
                    ? "border-neon-blue bg-neon-blue/15 text-neon-blue shadow-[0_0_8px_rgba(0,200,255,0.15)]"
                    : "border-border/50 text-muted-foreground hover:border-neon-blue/40 hover:text-foreground hover:bg-secondary/50"
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

      {/* Pick Count & Number Selection */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">選取號碼數</span>
              <span className="font-mono-num text-neon-blue font-bold">{pick}</span>
            </div>
            <Slider
              value={[pick]}
              onValueChange={([v]) => setPick(v)}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
          </div>
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
              <p className="text-sm text-muted-foreground">{data.description}</p>
              <div className="flex flex-wrap gap-2 justify-center py-2">
                {data.numbers.map((num, idx) => (
                  <BingoBall
                    key={`${num}-${refreshKey}-${idx}`}
                    number={num}
                    size="lg"
                    variant={ballVariant}
                    showGlow
                    className="animate-float"
                    style={{ animationDelay: `${idx * 0.15}s` } as React.CSSProperties}
                  />
                ))}
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
