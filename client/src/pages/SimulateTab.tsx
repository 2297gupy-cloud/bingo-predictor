import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetTicket {
  id: number;
  gameType: "big" | "small" | "oddeven";
  betType: "big" | "small" | "odd" | "even";
  multiplier: number;
  periods: number;
  totalBet: number;
}

interface DrawResult {
  period: number;
  drawNumbers: number[];
  winningTickets: BetTicket[];
}

// 投注倍數：2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 20x, 50x
const MULTIPLIERS = [2, 3, 4, 5, 6, 8, 10, 12, 20, 50];
// 投注期數：2, 3, 4, 5, 6, 7, 8, 9, 10, 12
const PERIODS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];

// 大小獎金
const BIG_SMALL_PRIZE = 150;
// 單雙獎金
const ODD_EVEN_PRIZE = 150;

// 過年加碼倍數
const NEW_YEAR_BONUS_MULTIPLIER = 1.5;

export default function SimulateTab() {
  // 猜大小選擇
  const [selectedBigSmall, setSelectedBigSmall] = useState<("big" | "small")[]>([]);
  // 猜單雙選擇
  const [selectedOddEven, setSelectedOddEven] = useState<("odd" | "even")[]>([]);
  
  // 投注倍數和期數
  const [bigSmallMultiplier, setBigSmallMultiplier] = useState(2);
  const [oddEvenMultiplier, setOddEvenMultiplier] = useState(2);
  const [periods, setPeriods] = useState(2);
  
  // 投注記錄
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");
  const [hasNewYearBonus, setHasNewYearBonus] = useState(false);

  // 計算投注金額
  const calculateBetAmount = (multiplier: number, periods: number, count: number) => {
    return multiplier * periods * count * 50; // 基礎投注金額 50 元
  };

  // 添加投注
  const handleAddBet = () => {
    const newTickets: BetTicket[] = [];
    let ticketId = tickets.length + 1;

    // 添加大小投注
    selectedBigSmall.forEach(type => {
      newTickets.push({
        id: ticketId++,
        gameType: type === "big" ? "big" : "small",
        betType: type,
        multiplier: bigSmallMultiplier,
        periods: periods,
        totalBet: calculateBetAmount(bigSmallMultiplier, periods, 1),
      });
    });

    // 添加單雙投注
    selectedOddEven.forEach(type => {
      newTickets.push({
        id: ticketId++,
        gameType: "oddeven",
        betType: type,
        multiplier: oddEvenMultiplier,
        periods: periods,
        totalBet: calculateBetAmount(oddEvenMultiplier, periods, 1),
      });
    });

    if (newTickets.length > 0) {
      setTickets([...newTickets, ...tickets]);
    }
  };

  // 模擬開獎
  const handleSimulateDraw = () => {
    const drawNumbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 1);
    const bigCount = drawNumbers.filter(n => n >= 41).length;
    const smallCount = drawNumbers.filter(n => n <= 40).length;
    const oddCount = drawNumbers.filter(n => n % 2 === 1).length;
    const evenCount = drawNumbers.filter(n => n % 2 === 0).length;

    const winningTickets = tickets.filter(ticket => {
      if (ticket.gameType === "big" || ticket.gameType === "small") {
        if (ticket.betType === "big") return bigCount >= 13;
        if (ticket.betType === "small") return smallCount >= 13;
      } else if (ticket.gameType === "oddeven") {
        if (ticket.betType === "odd") return oddCount >= 13;
        if (ticket.betType === "even") return evenCount >= 13;
      }
      return false;
    });

    const newResult: DrawResult = {
      period: results.length + 1,
      drawNumbers,
      winningTickets,
    };

    setResults([newResult, ...results.slice(0, 11)]);
  };

  // 清除投注
  const handleClearBets = () => {
    setTickets([]);
  };

  const totalBetAmount = tickets.reduce((sum, ticket) => sum + ticket.totalBet, 0);
  const totalWinAmount = results[0]?.winningTickets.reduce((sum, ticket) => sum + ticket.totalBet * (BIG_SMALL_PRIZE / 50), 0) || 0;

  return (
    <div className="w-full space-y-2 sm:space-y-3">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="bet">投注</TabsTrigger>
          <TabsTrigger value="results">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="bet" className="space-y-2 sm:space-y-3">
          {/* 獎金表 */}
          <Card className="border-orange-500 bg-black/40">
            <CardHeader className="pb-2 sm:pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm sm:text-base">獎金表</CardTitle>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={!hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(false)}
                    className={cn(
                      "text-xs px-2",
                      !hasNewYearBonus && "bg-cyan-400 hover:bg-cyan-500 text-black"
                    )}
                  >
                    無加碼
                  </Button>
                  <Button
                    size="sm"
                    variant={hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(true)}
                    className={cn(
                      "text-xs px-2",
                      hasNewYearBonus && "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                  >
                    過年加碼
                  </Button>
                </div>
              </div>
              {hasNewYearBonus && (
                <p className="text-xs text-orange-400 mt-1">✨ 春節加碼期間：2026/1/28 - 2026/2/10</p>
              )}
            </CardHeader>
            <CardContent className="pt-2">
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { stars: "大小", prize: "NT$150" },
                  { stars: "單雙", prize: "NT$150" },
                ].map((item) => (
                  <div
                    key={item.stars}
                    className="border border-orange-500 rounded p-1 text-xs sm:text-sm"
                  >
                    <div className="font-bold text-orange-400">{item.stars}</div>
                    <div className="text-orange-300">{item.prize}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 猜大小 */}
          <Card className="border-orange-500 bg-black/40">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base">猜大小（可複選）</CardTitle>
              <p className="text-xs text-gray-400 mt-1">大：41-80的號碼開出13個(含)以上 | 小：01-40的號碼開出13個(含)以上</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* 大小選擇 */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="big"
                    checked={selectedBigSmall.includes("big")}
                    onCheckedChange={(checked) => {
                      setSelectedBigSmall(prev =>
                        checked ? [...prev, "big"] : prev.filter(x => x !== "big")
                      );
                    }}
                  />
                  <label htmlFor="big" className="text-sm cursor-pointer">大</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="small"
                    checked={selectedBigSmall.includes("small")}
                    onCheckedChange={(checked) => {
                      setSelectedBigSmall(prev =>
                        checked ? [...prev, "small"] : prev.filter(x => x !== "small")
                      );
                    }}
                  />
                  <label htmlFor="small" className="text-sm cursor-pointer">小</label>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs px-2">快選</Button>
                </div>
              </div>

              {/* 投注倍數 */}
              <div className="space-y-1">
                <p className="text-xs text-gray-400">投注倍數</p>
                <div className="flex flex-wrap gap-1">
                  {MULTIPLIERS.map(m => (
                    <Button
                      key={m}
                      size="sm"
                      variant={bigSmallMultiplier === m ? "default" : "outline"}
                      onClick={() => setBigSmallMultiplier(m)}
                      className={cn(
                        "text-xs px-2",
                        bigSmallMultiplier === m && "bg-orange-500 hover:bg-orange-600 text-white"
                      )}
                    >
                      ×{m}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 猜單雙 */}
          <Card className="border-orange-500 bg-black/40">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base">猜單雙（可複選）</CardTitle>
              <p className="text-xs text-gray-400 mt-1">單：單數號碼開出13個(含)以上 | 雙：雙數號碼開出13個(含)以上</p>
            </CardHeader>
            <CardContent className="space-y-2">
              {/* 單雙選擇 */}
              <div className="flex gap-4 items-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="odd"
                    checked={selectedOddEven.includes("odd")}
                    onCheckedChange={(checked) => {
                      setSelectedOddEven(prev =>
                        checked ? [...prev, "odd"] : prev.filter(x => x !== "odd")
                      );
                    }}
                  />
                  <label htmlFor="odd" className="text-sm cursor-pointer">單</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="even"
                    checked={selectedOddEven.includes("even")}
                    onCheckedChange={(checked) => {
                      setSelectedOddEven(prev =>
                        checked ? [...prev, "even"] : prev.filter(x => x !== "even")
                      );
                    }}
                  />
                  <label htmlFor="even" className="text-sm cursor-pointer">雙</label>
                </div>
                <div className="ml-auto flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs px-2">快選</Button>
                </div>
              </div>

              {/* 投注倍數 */}
              <div className="space-y-1">
                <p className="text-xs text-gray-400">投注倍數</p>
                <div className="flex flex-wrap gap-1">
                  {MULTIPLIERS.map(m => (
                    <Button
                      key={m}
                      size="sm"
                      variant={oddEvenMultiplier === m ? "default" : "outline"}
                      onClick={() => setOddEvenMultiplier(m)}
                      className={cn(
                        "text-xs px-2",
                        oddEvenMultiplier === m && "bg-orange-500 hover:bg-orange-600 text-white"
                      )}
                    >
                      ×{m}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 多期投注 */}
          <Card className="border-orange-500 bg-black/40">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base">多期投注</CardTitle>
              <p className="text-xs text-gray-400 mt-1">請選擇您想連續投注幾期，若只想投注當期，請略過本欄</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {PERIODS.map(p => (
                  <Button
                    key={p}
                    size="sm"
                    variant={periods === p ? "default" : "outline"}
                    onClick={() => setPeriods(p)}
                    className={cn(
                      "text-xs px-2",
                      periods === p && "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                  >
                    {p}期
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 投注金額和按鈕 */}
          <Card className="border-orange-500 bg-black/40">
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span>投注金額：</span>
                <span className="text-orange-400 font-bold">NT${totalBetAmount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>投注組數：</span>
                <span className="text-orange-400 font-bold">{tickets.length} 組</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleAddBet}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                >
                  加入投注
                </Button>
                <Button
                  onClick={handleClearBets}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  清除
                </Button>
              </div>
              <Button
                onClick={handleSimulateDraw}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                開獎模擬
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-2 sm:space-y-3">
          {results.length === 0 ? (
            <Card className="border-orange-500 bg-black/40">
              <CardContent className="pt-6 text-center text-gray-400">
                尚無開獎結果
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx} className="border-orange-500 bg-black/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">第 {result.period} 期</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-400">開獎號碼</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {result.drawNumbers.map(num => (
                        <span key={num} className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          {num}
                        </span>
                      ))}
                    </div>
                  </div>
                  {result.winningTickets.length > 0 && (
                    <div>
                      <p className="text-xs text-green-400">中獎組數：{result.winningTickets.length}</p>
                      <p className="text-xs text-green-400">獎金：NT${result.winningTickets.reduce((sum, t) => sum + t.totalBet * 3, 0)}</p>
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
