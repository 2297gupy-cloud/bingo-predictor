import { useState } from "react";
import BingoBall from "@/components/BingoBall";
import { useHistory } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ClipboardList, ChevronLeft, ChevronRight, Search } from "lucide-react";

export default function HistoryTab() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const pageSize = 10;

  const { data, isLoading } = useHistory(page, pageSize, dateFilter || undefined);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-4">
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
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <ClipboardList className="h-4 w-4 text-neon-blue" />
              歷史紀錄
            </CardTitle>
            {data && (
              <span className="text-xs text-muted-foreground">
                共 <span className="font-mono-num text-neon-blue">{data.total}</span> 筆
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
            <div className="space-y-3">
              {data.draws.map(draw => (
                <div
                  key={draw.term}
                  className="rounded-lg border border-border/50 bg-secondary/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono-num">
                      第 <span className="text-foreground font-bold">{draw.term}</span> 期
                    </span>
                    <span className="font-mono-num">
                      {draw.draw_date} {draw.draw_time}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {draw.numbers.map((num, idx) => (
                      <BingoBall key={idx} number={num} size="sm" variant="default" />
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">
                      超級: <span className="font-mono-num text-neon-purple font-bold">{draw.special}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {draw.big_small} / {draw.odd_even}
                    </span>
                  </div>
                </div>
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
