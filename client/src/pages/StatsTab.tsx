import { useState, useMemo } from "react";
import { useFrequency, useConsecutive } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Loader2, BarChart3, Repeat, Flame, Snowflake } from "lucide-react";

export default function StatsTab() {
  const [window, setWindow] = useState(20);
  const { data: frequency, isLoading: freqLoading } = useFrequency(window);
  const { data: consecutive, isLoading: consLoading } = useConsecutive(5);

  const maxCount = useMemo(() => {
    if (!frequency) return 1;
    return Math.max(...frequency.map(f => f.count), 1);
  }, [frequency]);

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
      {/* Window control */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">分析期數</span>
              <span className="font-mono-num text-neon-blue font-bold">{window}</span>
            </div>
            <Slider
              value={[window]}
              onValueChange={([v]) => setWindow(v)}
              min={5}
              max={200}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Frequency chart */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <BarChart3 className="h-4 w-4 text-neon-blue" />
            號碼頻率分布
          </CardTitle>
        </CardHeader>
        <CardContent>
          {freqLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
            </div>
          ) : frequency ? (
            <div className="space-y-1">
              {frequency.map(item => {
                const pct = (item.count / maxCount) * 100;
                const isHot = item.count >= maxCount * 0.7;
                const isCold = item.count <= maxCount * 0.2;
                return (
                  <div key={item.number} className="flex items-center gap-2 text-xs">
                    <span className="w-6 text-right font-mono-num text-muted-foreground">
                      {item.number}
                    </span>
                    <div className="flex-1 h-4 rounded-sm bg-secondary overflow-hidden">
                      <div
                        className={`h-full rounded-sm transition-all duration-500 ${
                          isHot
                            ? "bg-neon-orange/70"
                            : isCold
                            ? "bg-neon-blue/40"
                            : "bg-neon-purple/50"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-mono-num text-muted-foreground">
                      {item.count}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-4">尚無資料</p>
          )}
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
          </CardContent>
        </Card>
      </div>

      {/* Consecutive numbers */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Repeat className="h-4 w-4 text-neon-green" />
            連莊號碼
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
            </div>
          ) : consecutive && consecutive.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {consecutive.map(item => (
                <div
                  key={item.number}
                  className="flex items-center gap-2 rounded-lg border border-neon-green/30 bg-neon-green/5 p-2"
                >
                  <span className="font-mono-num text-lg font-bold text-neon-green">{item.number}</span>
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
    </div>
  );
}
