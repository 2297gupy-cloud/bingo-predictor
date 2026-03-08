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
  selectedNumbers: number[];
  isWinning?: boolean;
  winningAmount?: number;
}

interface DrawResult {
  period: number;
  drawNumbers: number[];
  winningTickets: BetTicket[];
}

// Multipliers: 2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x, 20x, 50x
const MULTIPLIERS = [2, 3, 4, 5, 6, 8, 10, 12, 20, 50];
// Periods: 2, 3, 4, 5, 6, 7, 8, 9, 10, 12
const PERIODS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12];
// Stars
const STARS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Base bet amount: 25 per star
const BASE_BET = 25;

// Format number
const formatNumber = (num: number): string => {
  return num.toLocaleString('zh-TW');
};

// Star prize mapping - regular
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

// Festival bonus prizes - 2026 Lunar New Year bonus
const STAR_PRIZES_BONUS: Record<number, number> = {
  1: 75,
  2: 150,
  3: 1000,
  4: 2000,
  5: 10000,
  6: 50000,
  7: 80000,
  8: 500000,
  9: 1000000,
  10: 5000000,
};

export default function SimulateTab() {
  // Selected star for betting
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  
  // Big/Small selection
  const [selectedBigSmall, setSelectedBigSmall] = useState<("big" | "small")[]>([]);
  // Odd/Even selection
  const [selectedOddEven, setSelectedOddEven] = useState<("odd" | "even")[]>([]);
  
  // Multiplier and periods (null = not selected)
  const [bigSmallMultiplier, setBigSmallMultiplier] = useState<number | null>(null);
  const [oddEvenMultiplier, setOddEvenMultiplier] = useState<number | null>(null);
  const [periods, setPeriods] = useState<number | null>(null);
  // Bet star
  const [betStar, setBetStar] = useState<number | null>(null);
  
  // Bet records
  const [tickets, setTickets] = useState<BetTicket[]>([]);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [activeTab, setActiveTab] = useState("bet");
  const [hasNewYearBonus, setHasNewYearBonus] = useState(false);

  // Calculate bet amount - only affected by multiplier and periods
  const calculateBetAmount = (multiplier: number | null, periods: number | null) => {
    return BASE_BET * (multiplier || 1) * (periods || 1);
  };

  // Calculate estimated winnings
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

  // Add bet
  const handleAddBet = () => {
    if (!betStar) {
      alert("Please select a star level");
      return;
    }

    const newTickets: BetTicket[] = [];
    let ticketId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1;

    // Add big/small bets
    selectedBigSmall.forEach(type => {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: type === "big" ? "big" : "small",
        betType: type,
        multiplier: bigSmallMultiplier,
        periods: periods || 1,
        totalBet: calculateBetAmount(bigSmallMultiplier, periods),
        selectedNumbers: selectedNumbers,
      });
    });

    // Add odd/even bets
    selectedOddEven.forEach(type => {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: "oddeven",
        betType: type,
        multiplier: oddEvenMultiplier,
        periods: periods || 1,
        totalBet: calculateBetAmount(oddEvenMultiplier, periods),
        selectedNumbers: selectedNumbers,
      });
    });

    // If no game type selected, add base bet
    if (selectedBigSmall.length === 0 && selectedOddEven.length === 0) {
      newTickets.push({
        id: ticketId++,
        star: betStar,
        gameType: "base",
        betType: "base",
        multiplier: null,
        periods: periods || 1,
        totalBet: calculateBetAmount(null, periods),
        selectedNumbers: selectedNumbers,
      });
    }

    if (newTickets.length > 0) {
      setTickets([...tickets, ...newTickets]);
      // Clear selections
      setBetStar(null);
      setSelectedBigSmall([]);
      setSelectedOddEven([]);
      setBigSmallMultiplier(null);
      setOddEvenMultiplier(null);
      setPeriods(null);
      // Switch to results tab
      setActiveTab('results');
    }
  };

  // Simulate draw
  const handleSimulateDraw = () => {
    if (tickets.length === 0) {
      alert("Please add a bet first");
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
      if (ticket.gameType === "base") return true;
      return false;
    });

    const newResult: DrawResult = {
      period: results.length + 1,
      drawNumbers,
      winningTickets,
    };

    setResults([newResult, ...results.slice(0, 11)]);
  };

  // Delete bet
  const handleDeleteBet = (id: number) => {
    setTickets(tickets.filter(t => t.id !== id));
  };

  // Clear all bets
  const handleClearBets = () => {
    setTickets([]);
  };

  // Random numbers
  const handleRandomNumbers = (starCount: number) => {
    const randomNumbers = Array.from(
      { length: starCount },
      () => Math.floor(Math.random() * 80) + 1
    );
    setSelectedNumbers(randomNumbers);
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
          {/* Star selection and betting - integrated */}
          <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
            <CardHeader className="py-1">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs">星級選擇</CardTitle>
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
              <p className="text-xs text-gray-400 mt-0.5">基礎投注: NT$25/星 | 點擊星級選擇並自動選號</p>
            </CardHeader>
            <CardContent className="py-0.5 space-y-1">
              {/* Star selection - 2 rows x 5 columns */}
              <div className="grid grid-cols-5 gap-1">
                {STARS.map(star => (
                  <button
                    key={star}
                    onClick={() => {
                      if (selectedStar === star) {
                        setSelectedStar(null);
                        setBetStar(null);
                      } else {
                        setSelectedStar(star);
                        setBetStar(star);
                        handleRandomNumbers(star);
                      }
                    }}
                    className={cn(
                      "text-xs px-1 py-1.5 rounded border text-center transition-all font-bold",
                      (selectedStar === star || betStar === star)
                        ? "bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-lg"
                        : "bg-black/20 text-gray-300 border-gray-600 hover:border-green-400"
                    )}
                  >
                    {star}
                  </button>
                ))}
              </div>

              {(selectedStar || betStar) && (
                <p className="text-xs text-orange-400 text-center mt-1">
                  {selectedStar && `Selected ${selectedNumbers.length} numbers - Prize: NT$${formatNumber(hasNewYearBonus ? STAR_PRIZES_BONUS[selectedStar] : STAR_PRIZES[selectedStar])}`}
                  {betStar && ` | Bet Star: ${betStar}`}
                </p>
              )}

              {/* Number selection */}
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
                        "text-xs px-1 py-1 rounded border text-center transition-all",
                        selectedNumbers.includes(num)
                          ? "bg-yellow-500 text-black border-yellow-600 font-bold"
                          : "bg-black/20 text-gray-400 border-gray-600 hover:border-yellow-400"
                      )}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Big/Small selection */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">大小</p>
                <div className="flex gap-1">
                  {["big", "small"].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedBigSmall(prev =>
                          prev.includes(type as "big" | "small")
                            ? prev.filter(t => t !== type)
                            : [...prev, type as "big" | "small"]
                        );
                      }}
                      className={cn(
                        "flex-1 text-xs px-2 py-1 rounded border transition-all",
                        selectedBigSmall.includes(type as "big" | "small")
                          ? "bg-blue-500 text-white border-blue-600"
                          : "bg-black/20 text-gray-400 border-gray-600 hover:border-blue-400"
                      )}
                    >
                      {type === "big" ? "大(41-80)" : "小(1-40)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Odd/Even selection */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">單雙</p>
                <div className="flex gap-1">
                  {["odd", "even"].map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedOddEven(prev =>
                          prev.includes(type as "odd" | "even")
                            ? prev.filter(t => t !== type)
                            : [...prev, type as "odd" | "even"]
                        );
                      }}
                      className={cn(
                        "flex-1 text-xs px-2 py-1 rounded border transition-all",
                        selectedOddEven.includes(type as "odd" | "even")
                          ? "bg-purple-500 text-white border-purple-600"
                          : "bg-black/20 text-gray-400 border-gray-600 hover:border-purple-400"
                      )}
                    >
                      {type === "odd" ? "單" : "雙"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiplier selection */}
              {selectedBigSmall.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-400">大小投注倍數</p>
                  <div className="grid grid-cols-5 gap-0.5">
                    {MULTIPLIERS.map(mult => (
                      <button
                        key={`bs-${mult}`}
                        onClick={() => setBigSmallMultiplier(bigSmallMultiplier === mult ? null : mult)}
                        className={cn(
                          "text-xs px-1 py-1 rounded border text-center transition-all",
                          bigSmallMultiplier === mult
                            ? "bg-green-500 text-white border-green-600 font-bold"
                            : "bg-black/20 text-gray-400 border-gray-600 hover:border-green-400"
                        )}
                      >
                        x{mult}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedOddEven.length > 0 && (
                <div className="space-y-0.5">
                  <p className="text-xs text-gray-400">單雙投注倍數</p>
                  <div className="grid grid-cols-5 gap-0.5">
                    {MULTIPLIERS.map(mult => (
                      <button
                        key={`oe-${mult}`}
                        onClick={() => setOddEvenMultiplier(oddEvenMultiplier === mult ? null : mult)}
                        className={cn(
                          "text-xs px-1 py-1 rounded border text-center transition-all",
                          oddEvenMultiplier === mult
                            ? "bg-green-500 text-white border-green-600 font-bold"
                            : "bg-black/20 text-gray-400 border-gray-600 hover:border-green-400"
                        )}
                      >
                        x{mult}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Period selection */}
              <div className="space-y-0.5">
                <p className="text-xs text-gray-400">投注期數</p>
                <div className="grid grid-cols-6 gap-0.5">
                  {PERIODS.map(p => (
                    <button
                      key={p}
                      onClick={() => setPeriods(periods === p ? null : p)}
                      className={cn(
                        "text-xs px-1 py-1 rounded border text-center transition-all",
                        periods === p
                          ? "bg-red-500 text-white border-red-600 font-bold"
                          : "bg-black/20 text-gray-400 border-gray-600 hover:border-red-400"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bet amount display */}
              {(selectedBigSmall.length > 0 || selectedOddEven.length > 0 || betStar) && (
                <div className="bg-black/20 border border-orange-500/30 rounded p-1 text-xs text-orange-400">
                  <div>Base: NT${formatNumber(BASE_BET)} x {bigSmallMultiplier || oddEvenMultiplier || 1} x {periods || 1} = NT${formatNumber(calculateBetAmount(bigSmallMultiplier || oddEvenMultiplier, periods))}</div>
                  {calculateEstimatedWinnings() > 0 && (
                    <div className="text-yellow-400">Estimated winnings: NT${formatNumber(calculateEstimatedWinnings())}</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bet buttons */}
          <div className="flex gap-1">
            <Button onClick={handleAddBet} className="flex-1 text-xs h-7 bg-orange-500 hover:bg-orange-600">
              加入投注
            </Button>
            <Button onClick={handleClearBets} variant="outline" className="flex-1 text-xs h-7">
              清除投注
            </Button>
            <Button onClick={handleSimulateDraw} className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700">
              模擬開獨
            </Button>
          </div>

          {/* Bet records */}
          {tickets.length > 0 && (
            <Card className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
              <CardHeader className="py-1">
                <CardTitle className="text-xs">投注紀錄 (最多12筆)</CardTitle>
              </CardHeader>
              <CardContent className="py-0.5 space-y-0.5 max-h-40 overflow-y-auto">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="flex justify-between items-center text-xs bg-black/20 p-1 rounded">
                    <span className="text-gray-300">
                      {ticket.gameType === "base" ? "基礎" : ticket.gameType === "big" ? "大" : ticket.gameType === "small" ? "小" : ticket.betType === "odd" ? "單" : "雙"}
                      {ticket.multiplier && ` x${ticket.multiplier}`}
                      {ticket.periods && ` ${ticket.periods}p`}
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
                  Total: NT${formatNumber(totalBetAmount)}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-1.5">
          {/* Display bet records */}
          {tickets.length > 0 && (
            <Card className="border-green-500 bg-black/40">
              <CardHeader className="py-1">
                <CardTitle className="text-xs">投注紀錄</CardTitle>
              </CardHeader>
              <CardContent className="py-0.5 space-y-1">
                {tickets.map(ticket => {
                  const gameTypeLabel = ticket.gameType === 'base' ? 'Base' : ticket.gameType === 'big' ? 'Big' : ticket.gameType === 'small' ? 'Small' : ticket.betType === 'odd' ? 'Odd' : 'Even';
                  const numbersDisplay = ticket.selectedNumbers && ticket.selectedNumbers.length > 0 ? ticket.selectedNumbers.join(', ') : 'None';
                  const winStatus = ticket.isWinning ? 'Win NT$' + formatNumber(ticket.winningAmount || 0) : 'Lose';
                  
                  return (
                    <div key={ticket.id} className="text-xs text-green-400 border border-green-500/30 rounded p-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div>{gameTypeLabel} | {ticket.star}星 | 號碼: {numbersDisplay}</div>
                          <div>x{ticket.multiplier || 1} {ticket.periods}p - NT${formatNumber(ticket.totalBet)}</div>
                        </div>
                        <div className={ticket.isWinning ? 'text-yellow-400 font-bold' : 'text-red-400'}>
                          {winStatus}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="text-xs text-green-400 font-bold border-t border-green-500/30 pt-1 mt-1">
                  Total: NT${formatNumber(tickets.reduce((sum, t) => sum + t.totalBet, 0))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Display draw results */}
          {results.length === 0 ? (
                <Card className="border-orange-500 bg-black/40">
              <CardContent className="py-4 text-center text-xs text-gray-400">
                等待開獨...
              </CardContent>
            </Card>
          ) : (
            results.map(result => (
              <Card key={result.period} className="border-orange-500 bg-black/40" style={{ boxShadow: "0 0 8px rgba(255, 140, 0, 0.6)" }}>
                <CardHeader className="py-1">
                  <CardTitle className="text-xs">第 {result.period} 期開獨結果</CardTitle>
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
                      中獨投注: {result.winningTickets.length}
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
