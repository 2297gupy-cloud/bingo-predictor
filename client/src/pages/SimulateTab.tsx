'use client';

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
  gameType: "big" | "small" | "oddeven" | "base";
  betType: "big" | "small" | "odd" | "even" | "base";
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
// 星級獎金對照 - 平日獎金
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

// 過年加碼獎金 - 春節加碼期間（2026年春節加碼）
// 官方加碼詮简斧限於 1-6 星，7-10 星保持原獎金
const STAR_PRIZES_BONUS: Record<number, number> = {
  1: 75,
  2: 150,
  3: 1000,
  4: 2000,
  5: 10000,
  6: 50000,
  7: 80000,       // 保持原獎金
  8: 500000,      // 保持原獎金
  9: 1000000,     // 保持原獎金
  10: 5000000,    // 保持原獎金
};

export default function SimulateTab() {
  // 選擇星級玩法（用於選號）
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
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

  // 計算投注金額 - 只受倍數和期數影響，不受星級和選號數量影響
  const calculateBetAmount = (multiplier: number | null, periods: number | null) => {
    return BASE_BET * (multiplier || 1) * (periods || 1);
  };

  // 計算預估獎金
  const calculateEstimatedWinnings = () => {
    let total = 0;
    if (betStar && selectedBigSmall.length > 0 && periods) {
      const multiplier = bigSmallMultiplier || 1;
      total += 150 * betStar * multiplier * periods * selectedBigSmall.length;
    }
    if (betStar && selectedOddEven.length > 0 && periods) {
      const multiplier = oddEvenMultiplier || 1;
      total += 150 * betStar * multiplier * periods * selectedOddEven.length;
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
    let ticketId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;

    // 添加大小投注
    selectedBigSmall.forEach(type => {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: type === "big" ? "big" : "small",
        betType: type,
        multiplier: bigSmallMultiplier,
        periods: periods || 1,
        totalBet: calculateBetAmount(bigSmallMultiplier, periods),
      });
    });

    // 添加單雙投注
    selectedOddEven.forEach(type => {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: "oddeven",
        betType: type,
        multiplier: oddEvenMultiplier,
        periods: periods || 1,
        totalBet: calculateBetAmount(oddEvenMultiplier, periods),
      });
    });

    // 如果沒有選擇玩法，只投注基礎投注
    if (selectedBigSmall.length === 0 && selectedOddEven.length === 0) {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: "base",
        betType: "base",
        multiplier: null,
        periods: periods || 1,
        totalBet: calculateBetAmount(null, periods),
      });
    }

    if (newTickets.length > 0) {
      setTickets([...tickets, ...newTickets]);
      // 清除投注選擇
      setBetStar(null);
      setSelectedBigSmall([]);
      setSelectedOddEven([]);
      setBigSmallMultiplier(null);
      setOddEvenMultiplier(null);
      setPeriods(null);
    }
  };

  // 模擬開獎
  const handleSimulateDraw = () => {
    if (tickets.length === 0) {
      alert("請先加入投注");
      return;
    }

    const drawNumbers = Array.from({ length: 20 }, () => Math.floor(Math.random() * 80) + 1);
    const bigCount = drawNumbers.filter(n => n >= 41).length;
    const smallCount = drawNumbers.filter(n => n <= 40).length;
    const oddCount = drawNumbers.filter(n => n % 2 === 1).length;
    const evenCount = drawNumbers.filter(n => n % 2 === 0).length;

    const winningTickets = tickets.filter(ticket => {
      if (ticket.gameType === "big") return bigCount >= 13;
      if (ticket.gameType === "small") return smallCount >= 13;
      if (ticket.gameType === "oddeven") {
        if (ticket.betType === "odd") return oddCount >= 13;
        if (ticket.betType === "even") return evenCount >= 13;
      }
      if (ticket.gameType === "base") return true; // 基礎投注總是中獎
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
    // 同時設置投注星級
    setBetStar(starCount);
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
          {/* 星級選擇與投注 - 整合區塊 */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs">⭐ 選擇星級玩法</CardTitle>
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
                    節慶加碼
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">基本投注：NT$25/顆星 | 點擊星級可選擇投注並自動選號</p>
            </CardHeader>
            <CardContent className="py-0.5 space-y-1">
              {/* 星級選擇 - 2行5列 */}
              <div className="grid grid-cols-5 gap-1">
                {STARS.map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      // 同時更新選號和投注星級
                      setSelectedStar(selectedStar === star ? null : star);
                      setBetStar(betStar === star ? null : star);
                      if (selectedStar !== star) {
                        handleRandomNumbers(star);
                      }
                    }}
                    className={cn(
                      "text-xs px-0.5 py-1 rounded border text-center transition-all",
                      (selectedStar === star || betStar === star)
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    <div className="font-bold">{star}星</div>
                    <div className="text-xs leading-tight truncate">NT${formatNumber(BASE_BET)}</div>
                  </button>
                ))}
              </div>

              {(selectedStar || betStar) && (
                <p className="text-xs text-orange-400 text-center">
                  {selectedStar && `選 ${selectedNumbers.length} 個號碼 · 全中獎金 NT$${formatNumber(hasNewYearBonus ? STAR_PRIZES_BONUS[selectedStar] : STAR_PRIZES[selectedStar])}`}
                  {betStar && ` | 投注星級：${betStar}星`}
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
          {betStar && (
            <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
              <CardContent className="py-0.5 space-y-0.5">
                <div className="text-xs">
                  <p className="text-orange-400">
                    選擇投注：{betStar}星 × NT${BASE_BET} = NT${formatNumber(BASE_BET * betStar)}/組
                  </p>
                  {selectedBigSmall.length > 0 && (
                    <p className="text-orange-400">
                      大小投注：NT${formatNumber(BASE_BET)} × {bigSmallMultiplier || 1} × {periods || 1} = NT${formatNumber(calculateBetAmount(bigSmallMultiplier, periods || 1))}/組
                    </p>
                  )}
                  {selectedOddEven.length > 0 && (
                    <p className="text-orange-400">
                      單雙投注：NT${formatNumber(BASE_BET)} × {oddEvenMultiplier || 1} × {periods || 1} = NT${formatNumber(calculateBetAmount(oddEvenMultiplier, periods || 1))}/組
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
          )}

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
                      {ticket.gameType === "base" ? "基礎" : ticket.gameType === "big" ? "大" : ticket.gameType === "small" ? "小" : ticket.betType === "odd" ? "單" : "雙"}
                      {ticket.multiplier && ` ×${ticket.multiplier}`}
                      {ticket.periods && ` ${ticket.periods}期`}
                      {" - "}NT${formatNumber(ticket.totalBet)}
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
