"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BetTicket {
  id: number;
  star: number;
  gameType: "big" | "small" | "oddeven";
  betType: "big" | "small" | "odd" | "even";
  multiplier: number | null;
  periods: number | null;
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

// 數字格式化
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW');
};

// 星級獎金對照
const STAR_PRIZES: Record<number, number> = {
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
  // 投注星級
  const [betStar, setBetStar] = useState<number | null>(null);
  
  // 投注記錄
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");
  const [hasNewYearBonus, setHasNewYearBonus] = useState(false);

  // 計算投注金額
  const calculateBetAmount = (star: number, multiplier: number | null, periods: number | null) => {
    if (multiplier === null || periods === null) return 0;
    return BASE_BET * star * multiplier * periods;
  };

  // 計算預估獎金
  const calculateEstimatedWinnings = () => {
    let total = 0;
    if (betStar && selectedBigSmall.length > 0 && bigSmallMultiplier && periods) {
      total += 150 * betStar * bigSmallMultiplier * periods * selectedBigSmall.length;
    }
    if (betStar && selectedOddEven.length > 0 && oddEvenMultiplier && periods) {
      total += 150 * betStar * oddEvenMultiplier * periods * selectedOddEven.length;
    }
    return total;
  };

  // 添加投注
  const handleAddBet = () => {
    if (!betStar) {
      alert("請選擇投注星級");
      return;
    }

    const newTickets: BetTicket[] = [];
    let ticketId = tickets.length + 1;

    // 如果沒有選擇玩法，只投注基礎投注（星級）
    if (selectedBigSmall.length === 0 && selectedOddEven.length === 0) {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: "big",
        betType: "big",
        multiplier: null,
        periods: periods || 1,
        totalBet: BASE_BET * betStar * (periods || 1),
      });
    } else {

      // 添加大小投注
      selectedBigSmall.forEach(type => {
        if (bigSmallMultiplier !== null) {
          newTickets.push({
            id: ticketId++,
            star: betStar,
            gameType: type === "big" ? "big" : "small",
            betType: type,
            multiplier: bigSmallMultiplier,
            periods: periods || 1,
            totalBet: calculateBetAmount(betStar, bigSmallMultiplier, periods || 1),
          });
        }
      });

      // 添加單雙投注
      selectedOddEven.forEach(type => {
        if (oddEvenMultiplier !== null) {
          newTickets.push({
            id: ticketId++,
            star: betStar,
            gameType: "oddeven",
            betType: type,
            multiplier: oddEvenMultiplier,
            periods: periods || 1,
            totalBet: calculateBetAmount(betStar, oddEvenMultiplier, periods || 1),
          });
        }
      });
    }

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

  return (
    <div className="space-y-2 px-2 sm:px-4 py-2">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-orange-500">
          <TabsTrigger value="bet" className="text-xs">投注</TabsTrigger>
          <TabsTrigger value="results" className="text-xs">結果</TabsTrigger>
        </TabsList>

        <TabsContent value="bet" className="space-y-1.5">
          {/* 獎金表 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs">💰 獎金表</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant={!hasNewYearBonus ? "default" : "outline"}
                    onClick={() => setHasNewYearBonus(false)}
                    className={cn(
                      "text-xs px-1.5 h-5",
                      !hasNewYearBonus && "bg-orange-500 hover:bg-orange-600 text-white"
                    )}
                  >
                    無加碼
                  </Button>
                  <Button
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
              <CardTitle className="text-xs">⭐ 選擇星級玩法</CardTitle>
            </CardHeader>
            <CardContent className="py-0.5 space-y-1">
              {/* 星級選擇 - 2行5列 */}
              <div className="grid grid-cols-5 gap-1">
                {STARS.map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      setSelectedStar(selectedStar === star ? null : star);
                      if (selectedStar !== star) {
                        handleRandomNumbers(star);
                      }
                    }}
                    style={selectedStar === star ? { boxShadow: "0 0 12px rgba(250, 204, 21, 0.8)" } : { boxShadow: "0 0 8px rgba(250, 204, 21, 0.3)" }}
                    className={cn(
                      "text-xs sm:text-sm px-1 sm:px-2 py-1 sm:py-1.5 rounded-lg border-2 text-center transition-all font-bold",
                      selectedStar === star
                        ? "bg-yellow-900/40 text-yellow-400 border-yellow-500"
                        : "bg-black/40 text-gray-300 border-gray-700 hover:border-yellow-500"
                    )}
                  >
                    <div className="font-bold text-xs sm:text-sm">{star}星</div>
                    <div className="text-xs text-gray-400 truncate leading-tight">NT${formatNumber(STAR_PRIZES[star]).slice(0, 6)}</div>
                  </button>
                ))}
              </div>
              
              {selectedStar && (
                <p className="text-xs text-gray-400 text-center">
                  選 {selectedStar} 個號碼 · 全中獎金 NT${formatNumber(STAR_PRIZES[selectedStar])}
                </p>
              )}

              {/* 號碼選擇 */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">選擇號碼</p>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-0.5">
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
              </div>
            </CardContent>
          </Card>

          {/* 投注星級選擇 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <CardTitle className="text-xs">投注星級</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">基本投注：NT$25/顆星</p>
            </CardHeader>
            <CardContent className="py-0.5">
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-0.5">
                {STARS.map(star => (
                  <button
                    key={star}
                    onClick={() => setBetStar(betStar === star ? null : star)}
                    className={cn(
                      "text-xs px-0.5 py-0.5 rounded border text-center transition-all",
                      betStar === star
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {star}星
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
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-0.5">
                  {MULTIPLIERS.map(m => (
                    <button
                      key={m}
                      onClick={() => setBigSmallMultiplier(bigSmallMultiplier === m ? null : m)}
                      className={cn(
                        "text-xs px-0.5 py-0.5 rounded border text-center transition-all",
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
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-0.5">
                  {MULTIPLIERS.map(m => (
                    <button
                      key={m}
                      onClick={() => setOddEvenMultiplier(oddEvenMultiplier === m ? null : m)}
                      className={cn(
                        "text-xs px-0.5 py-0.5 rounded border text-center transition-all",
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
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                {PERIODS.map(p => (
                  <button
                    key={p}
                    onClick={() => setPeriods(periods === p ? null : p)}
                    className={cn(
                      "text-xs px-0 py-1 rounded border text-center transition-all h-7 flex items-center justify-center",
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
                {betStar && (
                  <p className="text-orange-400">
                    選擇投注：{betStar}星 × NT${BASE_BET} = NT${formatNumber(BASE_BET * betStar)}/組
                  </p>
                )}
                {betStar && bigSmallMultiplier && periods && (
                  <p className="text-orange-400">
                    大小投注：NT${formatNumber(BASE_BET * betStar)} × {bigSmallMultiplier} × {periods} = NT${formatNumber(calculateBetAmount(betStar, bigSmallMultiplier, periods))}/組
                  </p>
                )}
                {betStar && oddEvenMultiplier && periods && (
                  <p className="text-orange-400">
                    單雙投注：NT${formatNumber(BASE_BET * betStar)} × {oddEvenMultiplier} × {periods} = NT${formatNumber(calculateBetAmount(betStar, oddEvenMultiplier, periods))}/組
                  </p>
                )}
                {calculateEstimatedWinnings() > 0 && (
                  <p className="text-green-400 font-bold">
                    預估獎金：NT${formatNumber(calculateEstimatedWinnings())}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 投注按鈕 */}
          <div className="flex gap-1">
            <Button onClick={handleAddBet} className="flex-1 text-xs h-7 bg-orange-500 hover:bg-orange-600">
              加入投注
            </Button>
            <Button onClick={handleClearBets} variant="outline" className="flex-1 text-xs h-7">
              清除投注
            </Button>
            <Button onClick={handleSimulateDraw} className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700">
              模擬開獎
            </Button>
          </div>

          {/* 投注記錄 */}
          {tickets.length > 0 && (
            <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
              <CardHeader className="py-1">
                <CardTitle className="text-xs">投注記錄 (最多12期)</CardTitle>
              </CardHeader>
              <CardContent className="py-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex justify-between items-center text-xs bg-black/20 p-1 rounded">
                    <span className="text-gray-300">
                      {ticket.star}星 {ticket.betType === "big" ? "大" : ticket.betType === "small" ? "小" : ticket.betType === "odd" ? "單" : "雙"} ×{ticket.multiplier} {ticket.periods}期 = NT${formatNumber(ticket.totalBet)}
                    </span>
                    <button
                      onClick={() => handleDeleteBet(ticket.id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div className="text-xs text-orange-400 font-bold pt-1 border-t border-gray-600">
                  投注總額：NT${formatNumber(totalBetAmount)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-1.5">
          {results.length === 0 ? (
            <Card className="border-orange-500 bg-black/40">
              <CardContent className="py-4 text-center text-xs text-gray-400">
                尚無開獎結果
              </CardContent>
            </Card>
          ) : (
            results.map(result => (
              <Card key={result.period} className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
                <CardHeader className="py-1">
                  <CardTitle className="text-xs">第 {result.period} 期 開獎結果</CardTitle>
                </CardHeader>
                <CardContent className="py-0.5 space-y-1">
                  <div className="grid grid-cols-10 gap-0.5">
                    {result.drawNumbers.map((num, idx) => (
                      <div key={idx} className="text-xs bg-orange-500/20 border border-orange-500 rounded p-1 text-center text-orange-400 font-bold">
                        {num}
                      </div>
                    ))}
                  </div>
                  {result.winningTickets.length > 0 && (
                    <div className="text-xs text-green-400">
                      中獎投注：{result.winningTickets.length} 組
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
