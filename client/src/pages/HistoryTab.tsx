import { useState } from "react";
import { useHistory } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ClipboardList, ChevronLeft, ChevronRight, Search } from "lucide-react";
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
  const numbersStr = draw.numbers.map(n => String(n).padStart(2, "0")).join(",");

  return (
    <div
      className={cn(
        "rounded border px-2.5 py-1.5 transition-all",
        isFirst
          ? "border-neon-blue/40 bg-neon-blue/5"
          : "border-border/20 bg-transparent"
      )}
    >
      {/* Line 1: term + time */}
      <div className="font-mono-num text-xs font-bold text-foreground">
        {draw.term}{" "}
        <span className="text-muted-foreground font-normal">{draw.draw_time}</span>
      </div>
      {/* Line 2: numbers  special  big/small  odd/even */}
      <div className="flex items-baseline gap-0 mt-0.5 font-mono-num text-[11px] leading-snug">
        <span className={cn(isFirst ? "text-foreground/90" : "text-muted-foreground/80")}>
          {numbersStr}
        </span>
        <span className="text-muted-foreground/40 mx-1">&nbsp;&nbsp;</span>
        <span className="font-bold text-neon-purple">{String(draw.special).padStart(2, "0")}</span>
        <span className="text-muted-foreground/40 mx-0.5">&nbsp;</span>
        <span className={cn(
          "font-bold",
          draw.big_small === "大" ? "text-neon-orange" : draw.big_small === "小" ? "text-neon-blue" : "text-muted-foreground"
        )}>
          {draw.big_small || "－"}
        </span>
        <span className="text-muted-foreground/40 mx-0.5">&nbsp;</span>
        <span className={cn(
          "font-bold",
          draw.odd_even === "單" ? "text-neon-purple" : draw.odd_even === "雙" ? "text-neon-green" : "text-muted-foreground"
        )}>
          {draw.odd_even || "－"}
        </span>
      </div>
    </div>
  );
}

export default function HistoryTab() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const pageSize = 20;

  const { data, isLoading } = useHistory(page, pageSize, dateFilter || undefined);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-4 pb-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={dateFilter}
                onChange={e => {
                  setDateFilter(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-secondary border-border"
                placeholder="篩選日期"
              />
            </div>
            {dateFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDateFilter("");
                  setPage(1);
                }}
                className="border-neon-blue/30 text-xs"
              >
                清除
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <ClipboardList className="h-4 w-4 text-neon-blue" />
              歷史紀錄
            </CardTitle>
            {data && (
              <span className="text-xs text-muted-foreground">
                共 <span className="font-mono-num font-bold text-neon-blue">{data.total}</span> 筆
                {" · "}
                <span className="font-mono-num">{page}</span>/<span className="font-mono-num">{totalPages}</span> 頁
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neon-blue" />
            </div>
          ) : data && data.draws.length > 0 ? (
            <div className="space-y-1">
              {data.draws.map((draw: DrawData, idx: number) => (
                <DrawRow key={draw.term} draw={draw} isFirst={idx === 0 && page === 1} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              尚無歷史資料
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0 border-border"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                <span className="font-mono-num text-foreground">{page}</span>
                {" / "}
                <span className="font-mono-num">{totalPages}</span>
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-8 w-8 p-0 border-border"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
