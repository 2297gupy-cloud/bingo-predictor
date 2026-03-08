import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetTicket {
  id: number;
  gameType: "big" | "small" | "oddeven";
  betType: "big" | "small" | "odd" | "even";
  multiplier: number | null;
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
// 星級
const STARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// 基礎投注金額：一顆星 25 元
const BASE_BET = 25;

// 星級價錢對照
const STAR_PRICES: Record<number, number> = {
  1: 25,
  2: 50,
  3: 75,
  4: 100,
  5: 125,
  6: 150,
  7: 175,
  8: 200,
  9: 225,
  10: 250,
};

export default function SimulateTab() {
  // 星級選擇（單選）
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  // 選號（1-80）
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
  // 猜大小選擇
  const [selectedBigSmall, setSelectedBigSmall] = useState<("big" | "small")[]>([]);
  // 猜單雙選擇
  const [selectedOddEven, setSelectedOddEven] = useState<("odd" | "even")[]>([]);
  
  // 投注倍數和期數（null 表示未選擇）
  const [bigSmallMultiplier, setBigSmallMultiplier] = useState<number | null>(null);
  const [oddEvenMultiplier, setOddEvenMultiplier] = useState<number | null>(null);
  const [periods, setPeriods] = useState<number | null>(null);
  
  // 投注記錄
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");
  const [hasNewYearBonus, setHasNewYearBonus] = useState(false);

  // 計算投注金額
  const calculateBetAmount = (multiplier: number | null, periods: number | null) => {
    if (multiplier === null || periods === null) return 0;
    return BASE_BET * multiplier * periods;
  };

  // 計算預估獎金
  const calculateEstimatedWinnings = () => {
    let total = 0;
    if (selectedBigSmall.length > 0 && bigSmallMultiplier && periods) {
      total += 150 * bigSmallMultiplier * periods * selectedBigSmall.length;
    }
    if (selectedOddEven.length > 0 && oddEvenMultiplier && periods) {
      total += 150 * oddEvenMultiplier * periods * selectedOddEven.length;
    }
    return total;
  };

  // 添加投注
  const handleAddBet = () => {
    if (!periods) {
      alert("請選擇投注期數");
      return;
    }

    const newTickets: BetTicket[] = [];
    let ticketId = tickets.length + 1;

    // 添加大小投注
    selectedBigSmall.forEach(type => {
      if (bigSmallMultiplier !== null) {
        newTickets.push({
          id: ticketId++,
          gameType: type === "big" ? "big" : "small",
          betType: type,
          multiplier: bigSmallMultiplier,
          periods: periods,
          totalBet: calculateBetAmount(bigSmallMultiplier, periods),
        });
      }
    });

    // 添加單雙投注
    selectedOddEven.forEach(type => {
      if (oddEvenMultiplier !== null) {
        newTickets.push({
          id: ticketId++,
          gameType: "oddeven",
          betType: type,
          multiplier: oddEvenMultiplier,
          periods: periods,
          totalBet: calculateBetAmount(oddEvenMultiplier, periods),
        });
      }
    });

    if (newTickets.length > 0) {
      setTickets([...newTickets, ...tickets]);
    } else {
      alert("請選擇投注倍數和玩法");
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

  // 刪除投注
  const handleDeleteBet = (id: number) => {
    setTickets(tickets.filter(t => t.id !== id));
  };

  // 清除所有投注
  const handleClearBets = () => {
    setTickets([]);
  };

  // 隨機選擇號碼
  const handleRandomNumbers = (starCount: number) => {
    const randomNumbers = Array.from(
      { length: starCount },
      () => Math.floor(Math.random() * 80) + 1
    );
    setSelectedNumbers(randomNumbers);
  };

  const totalBetAmount = tickets.reduce((sum, ticket) => sum + ticket.totalBet, 0);
  const estimatedWinnings = calculateEstimatedWinnings();

  return (
    <div className="w-full space-y-0.5 sm:space-y-1">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-6">
          <TabsTrigger value="bet" className="text-xs">投注</TabsTrigger>
          <TabsTrigger value="results" className="text-xs">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="bet" className="space-y-0.5 sm:space-y-1">
          {/* 獎金表 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-xs">獎金表</CardTitle>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant={!hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(false)}
                    className={cn(
                      "text-xs px-1.5 h-5",
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
                      "text-xs px-1.5 h-5",
                      hasNewYearBonus && "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                  >
                    過年加碼
                  </Button>
                </div>
              </div>
              {hasNewYearBonus && (
                <p className="text-xs text-orange-400 mt-0.5">✨ 春節加碼期間：2026/1/28 - 2026/2/10</p>
              )}
            </CardHeader>
            <CardContent className="py-0.5">
              <div className="grid grid-cols-2 gap-0.5 text-center">
                {[
                  { name: "大小", prize: "NT$150" },
                  { name: "單雙", prize: "NT$150" },
                ].map((item) => (
                  <div
                    key={item.name}
                    className="border border-orange-500 rounded p-0.5 text-xs"
                  >
                    <div className="font-bold text-orange-400">{item.name}</div>
                    <div className="text-orange-300 text-xs">{item.prize}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 星級選號 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <CardTitle className="text-xs">星級選號（1-10星，單選）</CardTitle>
            </CardHeader>
            <CardContent className="py-0.5 space-y-0.5">
              {/* 星級選擇 */}
              <div className="flex flex-wrap gap-0.5">
                {STARS.map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      setSelectedStar(selectedStar === star ? null : star);
                      if (selectedStar !== star) {
                        handleRandomNumbers(star);
                      }
                    }}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded border text-center transition-all",
                      selectedStar === star
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    <div className="font-bold">{star}</div>
                    <div className="text-xs">{STAR_PRICES[star]}元</div>
                  </button>
                ))}
              </div>

              {/* 號碼選擇 */}
              {selectedNumbers.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">已選號碼：</p>
                  <div className="flex flex-wrap gap-0.5">
                    {selectedNumbers.map(num => (
                      <span
                        key={num}
                        className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded cursor-pointer hover:bg-orange-600"
                        onClick={() => setSelectedNumbers(prev => prev.filter(n => n !== num))}
                      >
                        {num}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 號碼網格 */}
              <div className="grid grid-cols-10 gap-0.5 text-center">
                {Array.from({ length: 80 }, (_, i) => i + 1).map(num => (
                  <button
                    key={num}
                    onClick={() => {
                      setSelectedNumbers(prev =>
                        prev.includes(num)
                          ? prev.filter(n => n !== num)
                          : [...prev, num]
                      );
                    }}
                    className={cn(
                      "text-xs px-0.5 py-0.5 rounded border text-center",
                      selectedNumbers.includes(num)
                        ? "bg-green-500 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 猜大小 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <CardTitle className="text-xs">猜大小（可複選）</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">大：41-80開出13個(含)以上 | 小：01-40開出13個(含)以上</p>
            </CardHeader>
            <CardContent className="py-0.5 space-y-0.5">
              {/* 大小選擇 */}
              <div className="flex gap-1 items-center flex-wrap">
                {["big", "small"].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedBigSmall(prev =>
                        prev.includes(type as "big" | "small")
                          ? prev.filter(x => x !== type)
                          : [...prev, type as "big" | "small"]
                      );
                    }}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded border text-center transition-all",
                      selectedBigSmall.includes(type as "big" | "small")
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {type === "big" ? "大" : "小"}
                  </button>
                ))}
                <div className="ml-auto">
                  <Button size="sm" variant="outline" className="text-xs px-1.5 h-5">快選</Button>
                </div>
              </div>

              {/* 投注倍數 */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">投注倍數</p>
                <div className="flex flex-wrap gap-0.5">
                  {MULTIPLIERS.map(m => (
                    <button
                      key={m}
                      onClick={() => setBigSmallMultiplier(m)}
                      className={cn(
                        "text-xs px-1 py-0.5 rounded border text-center transition-all",
                        bigSmallMultiplier === m
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                          : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                      )}
                    >
                      ×{m}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 猜單雙 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <CardTitle className="text-xs">猜單雙（可複選）</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">單：開出13個(含)以上 | 雙：開出13個(含)以上</p>
            </CardHeader>
            <CardContent className="py-0.5 space-y-0.5">
              {/* 單雙選擇 */}
              <div className="flex gap-1 items-center flex-wrap">
                {["odd", "even"].map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedOddEven(prev =>
                        prev.includes(type as "odd" | "even")
                          ? prev.filter(x => x !== type)
                          : [...prev, type as "odd" | "even"]
                      );
                    }}
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded border text-center transition-all",
                      selectedOddEven.includes(type as "odd" | "even")
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {type === "odd" ? "單" : "雙"}
                  </button>
                ))}
                <div className="ml-auto">
                  <Button size="sm" variant="outline" className="text-xs px-1.5 h-5">快選</Button>
                </div>
              </div>

              {/* 投注倍數 */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">投注倍數</p>
                <div className="flex flex-wrap gap-0.5">
                  {MULTIPLIERS.map(m => (
                    <button
                      key={m}
                      onClick={() => setOddEvenMultiplier(m)}
                      className={cn(
                        "text-xs px-1 py-0.5 rounded border text-center transition-all",
                        oddEvenMultiplier === m
                          ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                          : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                      )}
                    >
                      ×{m}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 多期投注 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <CardTitle className="text-xs">多期投注</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">請選擇連續投注期數，若只想投注當期，請略過本欄</p>
            </CardHeader>
            <CardContent className="py-0.5">
              <div className="flex flex-wrap gap-0.5">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriods(p)}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded border text-center transition-all",
                      periods === p
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 投注金額明細 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardContent className="py-0.5 space-y-0.5">
              <div className="text-xs">
                <p className="text-gray-400">基礎投注：NT${BASE_BET}/顆星</p>
                {bigSmallMultiplier && periods && (
                  <p className="text-orange-400">
                    大小投注：NT${BASE_BET} × {bigSmallMultiplier} × {periods} = NT${calculateBetAmount(bigSmallMultiplier, periods)}/組
                  </p>
                )}
                {oddEvenMultiplier && periods && (
                  <p className="text-orange-400">
                    單雙投注：NT${BASE_BET} × {oddEvenMultiplier} × {periods} = NT${calculateBetAmount(oddEvenMultiplier, periods)}/組
                  </p>
                )}
                {estimatedWinnings > 0 && (
                  <p className="text-green-400 mt-0.5">
                    預估獎金：NT${estimatedWinnings}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 投注記錄 */}
          {tickets.length > 0 && (
            <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
              <CardHeader className="py-1">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs">投注記錄</CardTitle>
                  <span className="text-xs text-orange-400">共 {tickets.length} 組</span>
                </div>
              </CardHeader>
              <CardContent className="py-0.5 space-y-0.5 max-h-24 overflow-y-auto">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between text-xs bg-black/20 p-0.5 rounded">
                    <div className="flex-1">
                      <span className="text-gray-300">
                        {ticket.betType === "big" ? "大" : ticket.betType === "small" ? "小" : ticket.betType === "odd" ? "單" : "雙"}
                        {" "}×{ticket.multiplier} × {ticket.periods}期
                      </span>
                      <span className="text-orange-400 ml-2">NT${ticket.totalBet}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteBet(ticket.id)}
                      className="h-4 w-4 p-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* 投注總額和按鈕 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardContent className="py-0.5 space-y-0.5">
              <div className="flex justify-between text-xs">
                <span>投注總額：</span>
                <span className="text-orange-400 font-bold">NT${totalBetAmount}</span>
              </div>
              <div className="flex gap-0.5">
                <Button
                  onClick={handleAddBet}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-xs h-6"
                >
                  加入投注
                </Button>
                <Button
                  onClick={handleClearBets}
                  variant="outline"
                  className="flex-1 text-xs h-6"
                >
                  <RotateCcw className="w-3 h-3 mr-0.5" />
                  清除
                </Button>
              </div>
              <Button
                onClick={handleSimulateDraw}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-6"
              >
                開獎模擬
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-0.5 sm:space-y-1">
          {results.length === 0 ? (
            <Card className="border-orange-500 bg-black/40">
              <CardContent className="py-1 text-center text-gray-400 text-xs">
                尚無開獎結果
              </CardContent>
            </Card>
          ) : (
            results.map((result, idx) => (
              <Card key={idx} className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
                <CardHeader className="py-1">
                  <CardTitle className="text-xs">第 {result.period} 期</CardTitle>
                </CardHeader>
                <CardContent className="py-0.5 space-y-0.5">
                  <div>
                    <p className="text-xs text-gray-400">開獎號碼</p>
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {result.drawNumbers.map(num => (
                        <span key={num} className="bg-orange-500 text-white text-xs px-1 py-0.5 rounded">
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
