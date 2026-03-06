import { useState, useMemo } from "react";
import { useFrequency, useConsecutive, useRepeatedTriples } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Repeat, Flame, Snowflake, Layers } from "lucide-react";
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
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">分析區間</span>
            <span className="text-xs text-muted-foreground">
              分析最近 <span className="font-mono-num font-bold text-neon-blue">{window}</span> 期
            </span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {WINDOW_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setWindow(opt)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-mono-num font-bold transition-all",
                  window === opt
                    ? "bg-neon-blue text-white shadow-[0_0_12px_oklch(0.7_0.15_250)]"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {opt}期
              </button>
            ))}
          </div>
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
