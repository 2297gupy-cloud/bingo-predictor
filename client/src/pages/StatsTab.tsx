import { useState, useMemo } from "react";
import { useFrequency, useConsecutive, useRepeatedTriples } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Repeat, Flame, Snowflake, Layers, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const WINDOW_OPTIONS = [1, 2, 3, 5, 10, 15, 20] as const;

export default function StatsTab() {
  const [window, setWindow] = useState(20);
  const { data: frequency, isLoading: freqLoading } = useFrequency(window);
  const { data: consecutive, isLoading: consLoading } = useConsecutive(window);
  const { data: repeatedTriples, isLoading: triplesLoading } = useRepeatedTriples(window);

  const hotNumbers = useMemo(() => {
    if (!frequency) return [];
    return [...frequency].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [frequency]);

  const coldNumbers = useMemo(() => {
    if (!frequency) return [];
    return [...frequency].sort((a, b) => a.count - b.count).slice(0, 10);
  }, [frequency]);

  return (
    <div className="space-y-4">
      {/* Window control - button style */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-4 sm:pt-5 pb-3 sm:pb-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neon-blue" />
              <span className="text-xs sm:text-sm font-medium text-foreground">分析區間</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <span>分析最近</span>
              <span className="font-mono-num font-bold text-neon-orange">{window}</span>
              <span>期</span>
            </div>
          </div>
          <div className="flex gap-1 sm:gap-1.5 flex-wrap">
            {WINDOW_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setWindow(opt)}
                className={cn(
                  "relative flex-1 min-w-[2.5rem] sm:min-w-[3rem] rounded-lg border px-1.5 sm:px-2 py-1.5 sm:py-2 text-center text-xs sm:text-sm font-mono-num font-medium transition-all",
                  window === opt
                    ? "border-neon-orange/60 bg-neon-orange/15 text-neon-orange shadow-[0_0_8px_rgba(255,160,50,0.2)]"
                    : "border-border/50 text-muted-foreground hover:border-neon-orange/40 hover:text-foreground hover:bg-neon-orange/5"
                )}
              >
                {opt}
                <span className="text-[10px] ml-0.5 opacity-70">期</span>
              </button>
            ))}
          </div>
          <p className="mt-1.5 sm:mt-2.5 text-[10px] sm:text-[11px] text-muted-foreground/60">
            選擇較少期數可觀察近期趨勢，較多期數可分析長期分布
          </p>
        </CardContent>
      </Card>

      {/* Hot & Cold numbers */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="neon-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-display">
              <Flame className="h-4 w-4 text-neon-orange" />
              熱門號碼
            </CardTitle>
          </CardHeader>
          <CardContent>
            {freqLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
              </div>
            ) : (
              <div className="space-y-1">
                {hotNumbers.map((item, idx) => (
                  <div key={item.number} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-muted-foreground">{idx + 1}</span>
                      <span className="font-mono-num font-bold text-neon-orange">{item.number}</span>
                    </div>
                    <span className="font-mono-num text-muted-foreground">{item.count}次</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="neon-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-1.5 text-sm font-display">
              <Snowflake className="h-4 w-4 text-neon-blue" />
              冷門號碼
            </CardTitle>
          </CardHeader>
          <CardContent>
            {freqLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
              </div>
            ) : (
              <div className="space-y-1">
                {coldNumbers.map((item, idx) => (
                  <div key={item.number} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-muted-foreground">{idx + 1}</span>
                      <span className="font-mono-num font-bold text-neon-blue">{item.number}</span>
                    </div>
                    <span className="font-mono-num text-muted-foreground">{item.count}次</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consecutive (連莊) numbers */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Repeat className="h-4 w-4 text-neon-green" />
            連莊號碼
            <span className="text-xs text-muted-foreground font-normal ml-1">
              連續 {window} 期內每期都出現
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
            </div>
          ) : consecutive && consecutive.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {consecutive.map(item => (
                <div key={item.number} className="flex flex-col items-center gap-1">
                  <div
                    className="flex items-center justify-center w-11 h-11 rounded-full font-mono-num text-base font-bold text-white"
                    style={{
                      background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #e53e3e, #c53030)',
                      boxShadow: '0 0 12px rgba(239, 68, 68, 0.6), 0 0 4px rgba(239, 68, 68, 0.3)',
                    }}
                  >
                    {String(item.number).padStart(2, '0')}
                  </div>
                  <span className="text-[10px] text-muted-foreground">連{item.streak}期</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              目前無連莊號碼
            </p>
          )}
        </CardContent>
      </Card>

      {/* Repeated Triples (重複三球) */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Layers className="h-4 w-4 text-neon-purple" />
            重複號碼
            <span className="text-xs text-muted-foreground font-normal ml-1">
              {window} 期內每期都出現的號碼
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {triplesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
            </div>
          ) : repeatedTriples && repeatedTriples.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {repeatedTriples.map((num: number) => (
                <div
                  key={num}
                  className="flex items-center justify-center w-11 h-11 rounded-full font-mono-num text-base font-bold text-white"
                  style={{
                    background: 'radial-gradient(circle at 35% 35%, #ff6b6b, #e53e3e, #c53030)',
                    boxShadow: '0 0 12px rgba(239, 68, 68, 0.6), 0 0 4px rgba(239, 68, 68, 0.3)',
                  }}
                >
                  {String(num).padStart(2, '0')}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">
              {window} 期內無每期都出現的重複號碼
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
