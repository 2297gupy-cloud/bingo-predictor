import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, RotateCcw, Trophy, TrendingUp, History, X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetTicket {
  id: number;
  gameType: "big" | "small" | "select" | "oddeven" | "superball";
  selectedNumbers: number[];
  oddEvenType?: "odd" | "even";
  multiplier: number;
  periods: number;
  groups: number;
  totalBet: number;
  hasSuperBall?: boolean;
}

interface DrawResult {
  period: number;
  drawNumbers: number[];
  superBall?: number;
  winningTickets: BetTicket[];
}

// 投注倍數：2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 20x, 50x
const MULTIPLIERS = [2, 3, 4, 5, 6, 8, 10, 12, 20, 50];
// 投注期數：2, 3, 4, 5, 6, 7, 8, 9, 10, 12
const PERIODS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
const NUMBERS = Array.from({ length: 80 }, (_, i) => i + 1);

// 獎金表 (標準獎金)
const PRIZE_TABLE: Record<number, number> = {
  1: 50,
  2: 75,
  3: 500,
  4: 1000,
  5: 7500,
  6: 25000,
  7: 80000,
  8: 500000,
  9: 1000000,
  10: 5000000,
};

// 超級獎獎金
const SUPER_BALL_PRIZE = 1200;
// 大小獎金
const BIG_SMALL_PRIZE = 150;
// 單雙獎金
const ODD_EVEN_PRIZE = 150;

// 過年加碼倍數 (例如: 1.5倍)
const NEW_YEAR_BONUS_MULTIPLIER = 1.5;

function generateRandomNumbers(count: number, max: number = 80): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1);
  const result: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return result.sort((a, b) => a - b);
}

export default function SimulateTab() {
  const [gameType, setGameType] = useState<"big" | "small" | "select" | "oddeven" | "superball">("select");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [oddEvenType, setOddEvenType] = useState<"odd" | "even">("odd");
  const [multiplier, setMultiplier] = useState(2);
  const [periods, setPeriods] = useState(2);
  const [groups, setGroups] = useState(1);
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");
  const [hasNewYearBonus, setHasNewYearBonus] = useState(false);
  const [hasSuperBall, setHasSuperBall] = useState(false);
  const [inputNumber, setInputNumber] = useState("");
  const [selectedStars, setSelectedStars] = useState<number | null>(null);

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      if (prev.length >= 6) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
  }, []);

  const handleInputNumber = useCallback(() => {
    const num = parseInt(inputNumber);
    if (num >= 1 && num <= 80) {
      toggleNumber(num);
      setInputNumber("");
    }
  }, [inputNumber, toggleNumber]);

  const handleRandomNumbers = useCallback(() => {
    const random = generateRandomNumbers(6);
    setSelectedNumbers(random);
  }, []);

  const handleClearNumbers = useCallback(() => {
    setSelectedNumbers([]);
  }, []);

  // 根據星級隨機選擇球號
  const handleRandomByStars = useCallback((stars: number) => {
    const random = generateRandomNumbers(stars);
    setSelectedNumbers(random);
    setGameType("select");
    setSelectedStars(stars);
  }, []);

  const handleAddBet = useCallback(() => {
    if (gameType === "select" && selectedNumbers.length === 0) return;
    if (gameType === "oddeven" && !oddEvenType) return;

    const newTicket: BetTicket = {
      id: tickets.length + 1,
      gameType,
      selectedNumbers: gameType === "select" ? [...selectedNumbers] : [],
      oddEvenType: gameType === "oddeven" ? oddEvenType : undefined,
      multiplier,
      periods,
      groups,
      totalBet: multiplier * periods * groups * 50,
      hasSuperBall: gameType === "superball" ? true : hasSuperBall,
    };

    setTickets(prev => [...prev, newTicket]);
    setSelectedNumbers([]);
  }, [gameType, selectedNumbers, oddEvenType, multiplier, periods, groups, tickets.length, hasSuperBall]);

  const handleSimulate = useCallback(() => {
    if (tickets.length === 0) return;

    const newResults: DrawResult[] = [];
    for (let p = 0; p < periods; p++) {
      const drawNumbers = generateRandomNumbers(20);
      const superBall = Math.floor(Math.random() * 80) + 1;

      const winningTickets = tickets.filter(ticket => {
        if (ticket.gameType === "select") {
          const matched = ticket.selectedNumbers.filter(n => drawNumbers.includes(n));
          return matched.length >= 3;
        }
        if (ticket.gameType === "big") {
          const bigCount = drawNumbers.filter(n => n > 40).length;
          return bigCount >= 10;
        }
        if (ticket.gameType === "small") {
          const smallCount = drawNumbers.filter(n => n <= 40).length;
          return smallCount >= 10;
        }
        if (ticket.gameType === "oddeven") {
          const count = drawNumbers.filter(n => {
            if (ticket.oddEvenType === "odd") return n % 2 === 1;
            return n % 2 === 0;
          }).length;
          return count >= 10;
        }
        if (ticket.gameType === "superball") {
          return drawNumbers.includes(superBall);
        }
        return false;
      });

      newResults.push({
        period: p + 1,
        drawNumbers,
        superBall,
        winningTickets,
      });
    }

    setResults(prev => [...newResults, ...prev].slice(0, 12));
    setActiveTab("results");
  }, [tickets, periods]);

  const handleClear = useCallback(() => {
    setTickets([]);
    setResults([]);
    setSelectedNumbers([]);
  }, []);

  const totalBet = useMemo(() => {
    return tickets.reduce((sum, t) => sum + t.totalBet, 0);
  }, [tickets]);

  const displayPrizeTable = useMemo(() => {
    const table: Record<number, number> = { ...PRIZE_TABLE };
    if (hasNewYearBonus) {
      Object.keys(table).forEach(key => {
        const numKey = parseInt(key);
        table[numKey] = Math.round(
          table[numKey] * NEW_YEAR_BONUS_MULTIPLIER
        );
      });
    }
    return table;
  }, [hasNewYearBonus]);

  return (
    <div className="space-y-2 pb-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bet">投注</TabsTrigger>
          <TabsTrigger value="results">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="bet" className="space-y-2">
          {/* Prize Table - 優化手機版 */}
          <Card className="neon-border bg-card border-orange-500">
            <CardHeader className="pb-1 sm:pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs sm:text-base">獎金表</CardTitle>
                <div className="flex gap-1 sm:gap-2">
                  <Button
                    variant={!hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(false)}
                    size="sm"
                    className="text-[10px] sm:text-xs px-2 sm:px-3"
                  >
                    無加碼
                  </Button>
                  <Button
                    variant={hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(true)}
                    size="sm"
                    className="text-[10px] sm:text-xs px-2 sm:px-3 bg-orange-500 hover:bg-orange-600"
                  >
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                    過年加碼
                  </Button>
                </div>
              </div>
              {hasNewYearBonus && (
                <div className="text-[8px] sm:text-[9px] text-orange-400 mt-1">
                  ✨ 春節加碼期間：2026/1/28 - 2026/2/10
                </div>
              )}
            </CardHeader>
            <CardContent className="p-2 sm:p-3">
              <div className="grid grid-cols-5 gap-1 sm:gap-2 text-[9px] sm:text-xs">
                {Object.entries(displayPrizeTable).map(([stars, prize]) => {
                  const starNum = parseInt(stars);
                  return (
                    <button
                      key={stars}
                      onClick={() => handleRandomByStars(starNum)}
                      className={cn(
                        "text-center p-1 sm:p-2 bg-background rounded border-2 transition-all cursor-pointer hover:border-orange-500 hover:bg-orange-500/10",
                        selectedStars === starNum ? "border-orange-500 bg-orange-500/20" : "border-border"
                      )}
                    >
                      <div className="font-bold text-orange-500 text-[8px] sm:text-xs">{starNum}星</div>
                      <div className="text-muted-foreground text-[7px] sm:text-[9px] truncate">NT${prize.toLocaleString()}</div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Game Type Selection - 整合到頂部 */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-base">選擇玩法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 sm:space-y-2">
              <div className="grid grid-cols-2 gap-1 sm:gap-2">
                <Button
                  variant={gameType === "big" ? "default" : "outline"}
                  onClick={() => setGameType("big")}
                  className={cn("text-xs sm:text-sm", gameType === "big" && "bg-orange-500 hover:bg-orange-600")}
                >
                  🔴 大
                </Button>
                <Button
                  variant={gameType === "small" ? "default" : "outline"}
                  onClick={() => setGameType("small")}
                  className={cn("text-xs sm:text-sm", gameType === "small" && "bg-orange-500 hover:bg-orange-600")}
                >
                  🔵 小
                </Button>
                <Button
                  variant={gameType === "select" ? "default" : "outline"}
                  onClick={() => setGameType("select")}
                  className={cn("text-xs sm:text-sm", gameType === "select" && "bg-orange-500 hover:bg-orange-600")}
                >
                  選擇球號
                </Button>
                <Button
                  variant={gameType === "oddeven" ? "default" : "outline"}
                  onClick={() => setGameType("oddeven")}
                  className={cn("text-xs sm:text-sm", gameType === "oddeven" && "bg-orange-500 hover:bg-orange-600")}
                >
                  🔵 單 / 🟠 雙
                </Button>
              </div>
              <Button
                variant={gameType === "superball" ? "default" : "outline"}
                onClick={() => setGameType("superball")}
                className={cn("w-full text-xs sm:text-sm", gameType === "superball" && "bg-orange-500 hover:bg-orange-600")}
              >
                ⭐ 超級獎
              </Button>
            </CardContent>
          </Card>

          {/* Number Selection - 優化球號選擇 */}
          {gameType === "select" && (
            <Card className="neon-border bg-card">
              <CardHeader className="pb-1 sm:pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-xs sm:text-base">
                    選擇球號 ({selectedNumbers.length}/6)
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button
                      onClick={handleRandomNumbers}
                      size="sm"
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 sm:px-3 hover:bg-orange-500/20 hover:border-orange-500"
                    >
                      🎲 隨機
                    </Button>
                    <Button
                      onClick={handleClearNumbers}
                      size="sm"
                      variant="outline"
                      className="text-[10px] sm:text-xs px-2 sm:px-3 hover:bg-orange-500/20 hover:border-orange-500"
                    >
                      🗑️ 清除
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2">
                {/* 快速輸入框 */}
                <div className="flex gap-1">
                  <input
                    type="number"
                    min="1"
                    max="80"
                    placeholder="輸入 1-80"
                    value={inputNumber}
                    onChange={(e) => setInputNumber(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleInputNumber()}
                    className="flex-1 px-2 py-1 text-xs sm:text-sm bg-background border border-border rounded text-foreground"
                  />
                  <Button
                    onClick={handleInputNumber}
                    size="sm"
                    className="text-xs sm:text-sm px-2 sm:px-3 bg-orange-500 hover:bg-orange-600"
                  >
                    加入
                  </Button>
                </div>
                {/* 號碼網格 - 縮小球號 */}
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5 sm:gap-1">
                  {NUMBERS.map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      className={cn(
                        "aspect-square text-[8px] sm:text-xs font-bold rounded border transition-all",
                        selectedNumbers.includes(num)
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-card border-border hover:border-orange-500"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Odd/Even Selection */}
          {gameType === "oddeven" && (
            <Card className="neon-border bg-card">
              <CardHeader className="pb-1 sm:pb-2">
                <CardTitle className="text-xs sm:text-base">選擇單雙</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2">
                <div className="grid grid-cols-2 gap-1 sm:gap-2">
                  <Button
                    variant={oddEvenType === "odd" ? "default" : "outline"}
                    onClick={() => setOddEvenType("odd")}
                    className={cn("text-xs sm:text-sm", oddEvenType === "odd" && "bg-orange-500 hover:bg-orange-600")}
                  >
                    🔵 單
                  </Button>
                  <Button
                    variant={oddEvenType === "even" ? "default" : "outline"}
                    onClick={() => setOddEvenType("even")}
                    className={cn("text-xs sm:text-sm", oddEvenType === "even" && "bg-orange-500 hover:bg-orange-600")}
                  >
                    🟠 雙
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multiplier Selection - 投注倍數 */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-base">投注倍數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                {MULTIPLIERS.map((m: number) => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={cn(
                      "text-[9px] sm:text-xs font-bold py-1 rounded border-2 transition-all",
                      multiplier === m
                        ? "bg-orange-500 border-orange-500 text-white"
                        : "bg-card border-border hover:border-orange-500"
                    )}
                  >
                    {m}x
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Periods Selection - 投注期數 */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-base">投注期數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 sm:space-y-2">
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                  {PERIODS.map((p: number) => (
                    <button
                      key={p}
                      onClick={() => setPeriods(p)}
                      className={cn(
                        "text-[9px] sm:text-xs font-bold py-1 rounded border-2 transition-all",
                        periods === p
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-card border-border hover:border-orange-500"
                      )}
                    >
                      {p}期
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 items-center justify-center">
                  <Button
                    onClick={() => setPeriods(Math.max(2, periods - 1))}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 hover:bg-orange-500/20 hover:border-orange-500"
                  >
                    −
                  </Button>
                  <span className="text-xs sm:text-sm font-bold min-w-[40px] text-center">{periods} 期</span>
                  <Button
                    onClick={() => setPeriods(Math.min(12, periods + 1))}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 hover:bg-orange-500/20 hover:border-orange-500"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Groups Selection */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-1 sm:pb-2">
              <CardTitle className="text-xs sm:text-base">投注組數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 sm:space-y-2">
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 10].map((g: number) => (
                    <button
                      key={g}
                      onClick={() => setGroups(g)}
                      className={cn(
                        "text-[9px] sm:text-xs font-bold py-1 rounded border-2 transition-all",
                        groups === g
                          ? "bg-orange-500 border-orange-500 text-white"
                          : "bg-card border-border hover:border-orange-500"
                      )}
                    >
                      {g}組
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 items-center justify-center">
                  <Button
                    onClick={() => setGroups(Math.max(1, groups - 1))}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 hover:bg-orange-500/20 hover:border-orange-500"
                  >
                    −
                  </Button>
                  <span className="text-xs sm:text-sm font-bold min-w-[40px] text-center">{groups} 組</span>
                  <Button
                    onClick={() => setGroups(Math.min(10, groups + 1))}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 hover:bg-orange-500/20 hover:border-orange-500"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bet Summary */}
          <Card className="neon-border bg-card border-orange-500">
            <CardContent className="pt-2 sm:pt-3">
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span>投注金額：</span>
                  <span className="font-bold text-orange-500">NT${totalBet.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>投注組數：</span>
                  <span className="font-bold">{tickets.length} 組</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-1 sm:gap-2">
            <Button
              onClick={handleAddBet}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs sm:text-sm"
            >
              加入投注
            </Button>
            <Button
              onClick={handleSimulate}
              disabled={tickets.length === 0}
              className="bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm disabled:opacity-50"
            >
              開始模擬
            </Button>
          </div>

          {tickets.length > 0 && (
            <Button
              onClick={handleClear}
              variant="destructive"
              className="w-full text-xs sm:text-sm"
            >
              清除所有投注
            </Button>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-2">
          {results.length === 0 ? (
            <Card className="neon-border bg-card">
              <CardContent className="pt-4 text-center text-muted-foreground text-xs sm:text-sm">
                尚無模擬結果，請先進行投注並開始模擬
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx} className="neon-border bg-card">
                <CardHeader className="pb-1 sm:pb-2">
                  <CardTitle className="text-xs sm:text-base">
                    第 {result.period} 期 - 開獎號碼
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 sm:space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {result.drawNumbers.map(num => (
                      <div
                        key={num}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] sm:text-xs font-bold"
                      >
                        {num}
                      </div>
                    ))}
                  </div>
                  {result.superBall && (
                    <div className="text-xs sm:text-sm">
                      <span className="font-bold">超級獎號：</span>
                      <span className="text-orange-500 font-bold ml-2">{result.superBall}</span>
                    </div>
                  )}
                  <div className="text-xs sm:text-sm">
                    <span className="font-bold">中獎組數：</span>
                    <span className="text-green-400 font-bold ml-2">{result.winningTickets.length}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
