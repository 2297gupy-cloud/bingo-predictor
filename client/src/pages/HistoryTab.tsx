import { useState, useMemo, useCallback } from "react";
import { useHistory } from "@/hooks/useBingo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ClipboardList, ChevronLeft, ChevronRight, Search, Calendar } from "lucide-react";
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

/**
 * Smart date parser: auto-complete year/month based on input
 * - "05" or "5" → 2026-03-05 (current year + current month + day)
 * - "0305" or "305" → 2026-03-05 (current year + month + day)
 * - "20260305" → 2026-03-05 (full date)
 * - "2026/03/05" or "2026-03-05" → 2026-03-05
 * - "03/05" or "3/5" → 2026-03-05
 */
function smartParseDate(input: string): string {
  const cleaned = input.replace(/[\/\-\.]/g, "");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 8 digits: YYYYMMDD
  if (/^\d{8}$/.test(cleaned)) {
    const y = cleaned.slice(0, 4);
    const m = cleaned.slice(4, 6);
    const d = cleaned.slice(6, 8);
    return `${y}-${m}-${d}`;
  }

  // 6 digits: YYMMDD
  if (/^\d{6}$/.test(cleaned)) {
    const y = "20" + cleaned.slice(0, 2);
    const m = cleaned.slice(2, 4);
    const d = cleaned.slice(4, 6);
    return `${y}-${m}-${d}`;
  }

  // 4 digits: MMDD
  if (/^\d{4}$/.test(cleaned)) {
    const m = cleaned.slice(0, 2);
    const d = cleaned.slice(2, 4);
    return `${year}-${m}-${d}`;
  }

  // 3 digits: MDD (e.g., 305 → 03/05)
  if (/^\d{3}$/.test(cleaned)) {
    const m = String(parseInt(cleaned.slice(0, 1))).padStart(2, "0");
    const d = cleaned.slice(1, 3);
    return `${year}-${m}-${d}`;
  }

  // 1-2 digits: DD (current year + current month)
  if (/^\d{1,2}$/.test(cleaned)) {
    const d = String(parseInt(cleaned)).padStart(2, "0");
    const m = String(month).padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  // Handle slash/dash separated: "3/5", "03/05", "2026/03/05"
  const parts = input.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const y = parts[0].length <= 2 ? "20" + parts[0].padStart(2, "0") : parts[0];
    const m = parts[1].padStart(2, "0");
    const d = parts[2].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (parts.length === 2) {
    const m = parts[0].padStart(2, "0");
    const d = parts[1].padStart(2, "0");
    return `${year}-${m}-${d}`;
  }

  return "";
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return "";
  // dateStr is "YYYY-MM-DD"
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return dateStr;
}

// Quick date buttons
function getQuickDates(): { label: string; date: string }[] {
  const dates: { label: string; date: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${day}`;
    const label = i === 0 ? "今天" : i === 1 ? "昨天" : `${m}/${day}`;
    dates.push({ label, date: dateStr });
  }
  return dates;
}

export default function HistoryTab() {
  const [page, setPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("");
  const [inputValue, setInputValue] = useState("");
  const pageSize = 20;

  const quickDates = useMemo(() => getQuickDates(), []);

  const { data, isLoading } = useHistory(page, pageSize, dateFilter || undefined);

  const totalPages = data ? Math.ceil(data.total / pageSize) : 0;

  const handleInputConfirm = useCallback((val: string) => {
    if (!val.trim()) {
      setDateFilter("");
      setPage(1);
      return;
    }
    const parsed = smartParseDate(val.trim());
    if (parsed) {
      setDateFilter(parsed);
      setInputValue(formatDisplayDate(parsed));
      setPage(1);
    }
  }, []);

  const handleQuickDate = useCallback((date: string) => {
    setDateFilter(date);
    setInputValue(formatDisplayDate(date));
    setPage(1);
  }, []);

  const handleClear = useCallback(() => {
    setDateFilter("");
    setInputValue("");
    setPage(1);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-4 pb-3 space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") handleInputConfirm(inputValue);
                }}
                onBlur={() => {
                  if (inputValue.trim()) handleInputConfirm(inputValue);
                }}
                className="pl-9 bg-secondary border-border font-mono-num"
                placeholder="輸入日期，如: 05、0305、2026/03/05"
              />
            </div>
            {dateFilter && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="border-neon-blue/30 text-xs"
              >
                清除
              </Button>
            )}
          </div>
          {/* Quick date buttons */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {quickDates.map(qd => (
              <Button
                key={qd.date}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDate(qd.date)}
                className={cn(
                  "h-6 px-2 text-[11px] border-border/50",
                  dateFilter === qd.date
                    ? "bg-neon-blue/20 border-neon-blue/50 text-neon-blue"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {qd.label}
              </Button>
            ))}
          </div>
          {dateFilter && (
            <p className="text-[11px] text-neon-blue font-mono-num">
              篩選日期：{formatDisplayDate(dateFilter)}
            </p>
          )}
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
                <DrawRow key={draw.term} draw={draw} isFirst={idx === 0 && page === 1 && !dateFilter} />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              {dateFilter ? `${formatDisplayDate(dateFilter)} 無開獎資料` : "尚無歷史資料"}
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
