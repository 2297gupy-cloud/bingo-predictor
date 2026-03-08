import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, RotateCcw, Trophy, TrendingUp, History, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetTicket {
  id: number;
  gameType: "big" | "small" | "select" | "oddeven";
  selectedNumbers: number[];
  oddEvenType?: "odd" | "even";
  multiplier: number;
  periods: number;
  totalBet: number;
}

interface DrawResult {
  period: number;
  drawNumbers: number[];
  winningTickets: BetTicket[];
}

const MULTIPLIERS = [2, 3, 4, 5, 6, 8, 10, 12, 20, 50];
const NUMBERS = Array.from({ length: 80 }, (_, i) => i + 1);

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
  const [gameType, setGameType] = useState<"big" | "small" | "select" | "oddeven">("select");
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [oddEvenType, setOddEvenType] = useState<"odd" | "even">("odd");
  const [multiplier, setMultiplier] = useState(2);
  const [periods, setPeriods] = useState(1);
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");

  const toggleNumber = useCallback((num: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(num)) return prev.filter(n => n !== num);
      if (prev.length >= 6) return prev;
      return [...prev, num].sort((a, b) => a - b);
    });
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
      totalBet: multiplier * periods * 50,
    };

    setTickets(prev => [...prev, newTicket]);
    setSelectedNumbers([]);
  }, [gameType, selectedNumbers, oddEvenType, multiplier, periods, tickets.length]);

  const handleSimulate = useCallback(() => {
    if (tickets.length === 0) return;

    const newResults: DrawResult[] = [];
    for (let p = 0; p < periods; p++) {
      const drawNumbers = generateRandomNumbers(20);
      const winningTickets = tickets.filter(ticket => {
        if (ticket.gameType === "select") {
          const matched = ticket.selectedNumbers.filter(n => drawNumbers.includes(n));
          return matched.length >= 3;
        }
        if (ticket.gameType === "oddeven") {
          const count = drawNumbers.filter(n => {
            if (ticket.oddEvenType === "odd") return n % 2 === 1;
            return n % 2 === 0;
          }).length;
          return count >= 10;
        }
        return false;
      });

      newResults.push({
        period: p + 1,
        drawNumbers,
        winningTickets,
      });
    }

    setResults(prev => [...newResults, ...prev].slice(0, 20));
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

  return (
    <div className="space-y-4 pb-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bet">投注</TabsTrigger>
          <TabsTrigger value="results">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="bet" className="space-y-4">
          {/* Game Type Selection */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">選擇玩法</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={gameType === "big" ? "default" : "outline"}
                  onClick={() => setGameType("big")}
                  className="text-sm"
                >
                  大
                </Button>
                <Button
                  variant={gameType === "small" ? "default" : "outline"}
                  onClick={() => setGameType("small")}
                  className="text-sm"
                >
                  小
                </Button>
                <Button
                  variant={gameType === "select" ? "default" : "outline"}
                  onClick={() => setGameType("select")}
                  className="text-sm"
                >
                  選擇球號
                </Button>
                <Button
                  variant={gameType === "oddeven" ? "default" : "outline"}
                  onClick={() => setGameType("oddeven")}
                  className="text-sm"
                >
                  猜單雙
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Number Selection */}
          {gameType === "select" && (
            <Card className="neon-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  選擇球號 ({selectedNumbers.length}/6)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1">
                  {NUMBERS.map(num => (
                    <button
                      key={num}
                      onClick={() => toggleNumber(num)}
                      className={cn(
                        "aspect-square text-xs font-bold rounded border-2 transition-all",
                        selectedNumbers.includes(num)
                          ? "bg-neon-blue border-neon-blue text-black"
                          : "bg-card border-border hover:border-neon-blue"
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">選擇單雙</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={oddEvenType === "odd" ? "default" : "outline"}
                    onClick={() => setOddEvenType("odd")}
                    className="text-sm"
                  >
                    單數
                  </Button>
                  <Button
                    variant={oddEvenType === "even" ? "default" : "outline"}
                    onClick={() => setOddEvenType("even")}
                    className="text-sm"
                  >
                    雙數
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multiplier Selection */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">級注倍數</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-1">
                {MULTIPLIERS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMultiplier(m)}
                    className={cn(
                      "aspect-square text-xs font-bold rounded border-2 transition-all",
                      multiplier === m
                        ? "bg-neon-blue border-neon-blue text-black"
                        : "bg-card border-border hover:border-neon-blue"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Periods Selection */}
          <Card className="neon-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">投注期數</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">期數</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPeriods(Math.max(1, periods - 1))}
                  >
                    −
                  </Button>
                  <span className="w-8 text-center font-bold">{periods}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPeriods(periods + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bet Summary */}
          {tickets.length > 0 && (
            <Card className="neon-border bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">投注單據</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {tickets.map(ticket => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between text-sm p-2 bg-background rounded border border-border"
                  >
                    <div className="flex-1">
                      <div className="font-bold">
                        {ticket.gameType === "select" && `選號: ${ticket.selectedNumbers.join(", ")}`}
                        {ticket.gameType === "oddeven" && `${ticket.oddEvenType === "odd" ? "單" : "雙"}數`}
                        {ticket.gameType === "big" && "大"}
                        {ticket.gameType === "small" && "小"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {ticket.multiplier}倍 × {ticket.periods}期 = {ticket.totalBet}點
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTickets(prev => prev.filter(t => t.id !== ticket.id))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="font-bold">總投注額</span>
                  <span className="font-bold text-neon-blue">{totalBet} 點</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleAddBet}
              className="bg-neon-blue hover:bg-neon-blue/80 text-black font-bold"
            >
              <Dices className="w-4 h-4 mr-2" />
              加入投注
            </Button>
            <Button
              onClick={handleSimulate}
              disabled={tickets.length === 0}
              className="bg-neon-green hover:bg-neon-green/80 text-black font-bold"
            >
              <Trophy className="w-4 h-4 mr-2" />
              開始模擬
            </Button>
          </div>

          {tickets.length > 0 && (
            <Button
              onClick={handleClear}
              variant="destructive"
              className="w-full"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              清除全部
            </Button>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {results.length === 0 ? (
            <Card className="neon-border bg-card">
              <CardContent className="pt-6 text-center text-muted-foreground">
                尚無開獎結果
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx} className="neon-border bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">第 {result.period} 期開獎</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Draw Numbers */}
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">開出號碼</div>
                    <div className="grid grid-cols-10 gap-1">
                      {result.drawNumbers.map(num => (
                        <div
                          key={num}
                          className="aspect-square flex items-center justify-center text-xs font-bold rounded bg-neon-green text-black"
                        >
                          {num}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Winning Tickets */}
                  {result.winningTickets.length > 0 && (
                    <div className="pt-2 border-t border-border">
                      <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-neon-yellow" />
                        中獎單據 ({result.winningTickets.length})
                      </div>
                      {result.winningTickets.map((ticket, tidx) => (
                        <div
                          key={tidx}
                          className="text-xs p-2 bg-background rounded border border-neon-yellow mb-1"
                        >
                          <div className="font-bold text-neon-yellow">
                            {ticket.gameType === "select" && `選號: ${ticket.selectedNumbers.join(", ")}`}
                            {ticket.gameType === "oddeven" && `${ticket.oddEvenType === "odd" ? "單" : "雙"}數`}
                            {ticket.gameType === "big" && "大"}
                            {ticket.gameType === "small" && "小"}
                          </div>
                          <div className="text-muted-foreground">
                            獲得: {ticket.totalBet * 2} 點
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {result.winningTickets.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center py-2">
                      本期無中獎
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
