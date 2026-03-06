import { useLatestDraws, useDbStats } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Database } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawData {
  term: string;
  draw_date: string;
  draw_time: string;
  numbers: number[];
  draw_order: number[];
  special: number;
  big_small: string;
  odd_even: string;
}

function DrawRow({ draw, isFirst }: { draw: DrawData; isFirst: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2.5 transition-all",
        isFirst
          ? "border-neon-blue/40 bg-neon-blue/5"
          : "border-border/20 bg-secondary/20"
      )}
    >
      {/* Row 1: term + time */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-3">
          <span className="font-mono-num text-xs font-bold text-foreground">
            {draw.term}
          </span>
          <span className="font-mono-num text-xs text-muted-foreground">
            {draw.draw_time}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Super number */}
          <span className="font-mono-num text-xs font-bold text-neon-purple">
            {String(draw.special).padStart(2, "0")}
          </span>
          {/* Big/Small */}
          <span
            className={cn(
              "text-[10px] font-bold",
              draw.big_small === "大"
                ? "text-neon-orange"
                : draw.big_small === "小"
                  ? "text-neon-blue"
                  : "text-muted-foreground"
            )}
          >
            {draw.big_small || "－"}
          </span>
          {/* Odd/Even */}
          <span
            className={cn(
              "text-[10px] font-bold",
              draw.odd_even === "單"
                ? "text-neon-purple"
                : draw.odd_even === "雙"
                  ? "text-neon-green"
                  : "text-muted-foreground"
            )}
          >
            {draw.odd_even || "－"}
          </span>
        </div>
      </div>

      {/* Row 2: numbers as plain text */}
      <p
        className={cn(
          "font-mono-num text-xs leading-relaxed tracking-wide",
          isFirst ? "text-foreground" : "text-muted-foreground"
        )}
      >
        {draw.numbers.map(n => String(n).padStart(2, "0")).join(" ")}
      </p>
    </div>
  );
}

export default function LatestTab() {
  const { data, isLoading } = useLatestDraws(10);
  const { data: dbStats } = useDbStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  if (!data || data.draws.length === 0) {
    return (
      <Card className="neon-border bg-card">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">尚無開獎資料，請先點擊「同步」按鈕</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Trophy className="h-4 w-4 text-neon-yellow" />
              即時開獎結果
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              最近 <span className="font-mono-num font-bold text-neon-blue">{data.draws.length}</span> 期
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {data.draws.map((draw, idx) => (
            <DrawRow key={draw.term} draw={draw} isFirst={idx === 0} />
          ))}
        </CardContent>
      </Card>

      {/* DB Stats */}
      {dbStats && (
        <Card className="neon-border bg-card">
          <CardContent className="py-4">
            <div className="flex items-center justify-center gap-6 text-center">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-neon-blue" />
                <span className="text-xs text-muted-foreground">資料庫總期數</span>
                <span className="font-mono-num text-sm font-bold text-neon-blue">{dbStats.total_draws}</span>
              </div>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">最新</span>
                <span className="font-mono-num text-sm font-bold">{dbStats.latest_date}</span>
                <span className="font-mono-num text-xs text-muted-foreground">{dbStats.latest_time}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
