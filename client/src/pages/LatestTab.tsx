import BingoBall from "@/components/BingoBall";
import { useLatestDraw, useDbStats } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trophy, Calendar, Clock, Hash, ArrowUpDown } from "lucide-react";

export default function LatestTab() {
  const { data: latest, isLoading } = useLatestDraw();
  const { data: dbStats } = useDbStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-neon-blue" />
      </div>
    );
  }

  if (!latest) {
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
      {/* Latest draw info */}
      <Card className="neon-border bg-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <Trophy className="h-4 w-4 text-neon-yellow" />
            最新開獎結果
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Meta info */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
              <Hash className="h-4 w-4 text-neon-blue" />
              <div>
                <p className="text-[10px] text-muted-foreground">期號</p>
                <p className="font-mono-num text-sm font-bold">{latest.term}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
              <Calendar className="h-4 w-4 text-neon-purple" />
              <div>
                <p className="text-[10px] text-muted-foreground">日期</p>
                <p className="font-mono-num text-sm font-bold">{latest.draw_date}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-secondary p-2.5">
              <Clock className="h-4 w-4 text-neon-orange" />
              <div>
                <p className="text-[10px] text-muted-foreground">時間</p>
                <p className="font-mono-num text-sm font-bold">{latest.draw_time}</p>
              </div>
            </div>
          </div>

          {/* Sorted numbers */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" />
              開獎號碼（排序）
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {latest.numbers.map((num, idx) => (
                <BingoBall key={`sorted-${idx}`} number={num} size="md" variant="default" />
              ))}
            </div>
          </div>

          {/* Draw order */}
          <div>
            <p className="mb-2 text-xs text-muted-foreground">開獎順序</p>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {latest.draw_order.map((num, idx) => (
                <BingoBall key={`order-${idx}`} number={num} size="sm" variant="neutral" />
              ))}
            </div>
          </div>

          {/* Special number & properties */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="flex flex-col items-center gap-1 rounded-lg border border-neon-purple/30 bg-neon-purple/5 p-3">
              <span className="text-[10px] text-muted-foreground">超級獎號</span>
              <BingoBall number={latest.special} size="lg" variant="special" showGlow />
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-neon-orange/30 bg-neon-orange/5 p-3">
              <span className="text-[10px] text-muted-foreground">大小</span>
              <span className="font-display text-lg font-bold text-neon-orange">{latest.big_small}</span>
            </div>
            <div className="flex flex-col items-center gap-1 rounded-lg border border-neon-blue/30 bg-neon-blue/5 p-3">
              <span className="text-[10px] text-muted-foreground">單雙</span>
              <span className="font-display text-lg font-bold text-neon-blue">{latest.odd_even}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* DB Stats */}
      {dbStats && (
        <Card className="neon-border bg-card">
          <CardContent className="py-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xs text-muted-foreground">資料庫總期數</p>
                <p className="font-mono-num text-2xl font-bold text-neon-blue">{dbStats.total_draws}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">最新資料</p>
                <p className="font-mono-num text-sm font-bold">{dbStats.latest_date}</p>
                <p className="font-mono-num text-xs text-muted-foreground">{dbStats.latest_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
