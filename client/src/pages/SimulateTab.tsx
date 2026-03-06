import { useState, useCallback, useMemo } from "react";
import BingoBall from "@/components/BingoBall";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dices, RotateCcw, Trophy, TrendingUp, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimResult {
  id: number;
  myNumbers: number[];
  drawNumbers: number[];
  matched: number[];
  matchCount: number;
}

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
  const [pick, setPick] = useState(5);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [results, setResults] = useState<SimResult[]>([]);
  const [simCount, setSimCount] = useState(0);

  const toggleNumber = useCallback(
    (num: number) => {
      setSelectedNumbers(prev => {
        if (prev.includes(num)) return prev.filter(n => n !== num);
        if (prev.length >= pick) return prev;
        return [...prev, num].sort((a, b) => a - b);
      });
    },
    [pick]
  );

  const handleQuickPick = useCallback(() => {
    setSelectedNumbers(generateRandomNumbers(pick));
  }, [pick]);

  const handleSimulate = useCallback(() => {
    if (selectedNumbers.length !== pick) return;
    const drawNumbers = generateRandomNumbers(20);
    const matched = selectedNumbers.filter(n => drawNumbers.includes(n));
    const newResult: SimResult = {
      id: simCount + 1,
      myNumbers: [...selectedNumbers],
      drawNumbers,
      matched,
      matchCount: matched.length,
    };
    setResults(prev => [newResult, ...prev].slice(0, 50));
    setSimCount(c => c + 1);
  }, [selectedNumbers, pick, simCount]);

  const handleReset = useCallback(() => {
    setSelectedNumbers([]);
    setResults([]);
    setSimCount(0);
  }, []);

  const stats = useMemo(() => {
    if (results.length === 0) return null;
    const totalMatched = results.reduce((sum, r) => sum + r.matchCount, 0);
    const maxMatched = Math.max(...results.map(r => r.matchCount));
    const avgMatched = totalMatched / results.length;
    return { totalMatched, maxMatched, avgMatched, total: results.length };
  }, [results]);

  return (
    <div className="space-y-4">
      {/* Pick count */}
      <Card className="neon-border bg-card">
        <CardContent className="pt-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">選取號碼數</span>
              <span className="font-mono-num text-neon-blue font-bold">{pick}</span>
            </div>
            <Slider
              value={[pick]}
              onValueChange={([v]) => {
                setPick(v);
                setSelectedNumbers([]);
              }}
              min={1}
              max={10}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Number grid */}
      <Card className="neon-border bg-card">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <Dices className="h-4 w-4 text-neon-purple" />
              選擇號碼
              <span className="text-xs text-muted-foreground font-sans font-normal">
                ({selectedNumbers.length}/{pick})
              </span>
            </CardTitle>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={handleQuickPick}
                className="h-7 text-xs border-neon-purple/30 hover:bg-neon-purple/10"
              >
                快選
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-7 text-xs border-border"
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 80 }, (_, i) => i + 1).map(num => {
              const isSelected = selectedNumbers.includes(num);
              return (
                <button
                  key={num}
                  onClick={() => toggleNumber(num)}
                  disabled={!isSelected && selectedNumbers.length >= pick}
                  className={cn(
                    "aspect-square rounded-md text-xs font-mono-num font-bold transition-all",
                    "border flex items-center justify-center",
                    isSelected
                      ? "bg-neon-purple/20 border-neon-purple text-neon-purple shadow-[0_0_8px_oklch(0.65_0.25_290/0.2)]"
                      : "bg-secondary border-border text-muted-foreground hover:border-neon-blue/50 hover:text-foreground",
                    !isSelected && selectedNumbers.length >= pick && "opacity-30 cursor-not-allowed"
                  )}
                >
                  {num}
                </button>
              );
            })}
          </div>

          <Button
            onClick={handleSimulate}
            disabled={selectedNumbers.length !== pick}
            className="mt-4 w-full bg-neon-purple/20 border border-neon-purple/50 text-neon-purple hover:bg-neon-purple/30 font-display"
          >
            <Dices className="mr-2 h-4 w-4" />
            模擬開獎
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="w-full bg-secondary">
          <TabsTrigger value="results" className="flex-1 gap-1.5 text-xs">
            <History className="h-3.5 w-3.5" />
            開獎紀錄
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex-1 gap-1.5 text-xs">
            <TrendingUp className="h-3.5 w-3.5" />
            統計
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="mt-3">
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.slice(0, 10).map(result => (
                <Card key={result.id} className="bg-card border-border/50">
                  <CardContent className="py-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>第 {result.id} 次</span>
                      <span className="flex items-center gap-1">
                        <Trophy className="h-3 w-3 text-neon-yellow" />
                        命中 <span className="font-mono-num text-neon-yellow font-bold">{result.matchCount}</span> 個
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {result.myNumbers.map((num, idx) => (
                        <BingoBall
                          key={idx}
                          number={num}
                          size="sm"
                          variant={result.matched.includes(num) ? "hot" : "neutral"}
                          showGlow={result.matched.includes(num)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                尚無模擬紀錄
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="stats" className="mt-3">
          {stats ? (
            <Card className="bg-card border-border/50">
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground">總模擬次數</p>
                    <p className="font-mono-num text-2xl font-bold text-neon-blue">{stats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">最高命中</p>
                    <p className="font-mono-num text-2xl font-bold text-neon-orange">{stats.maxMatched}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">平均命中</p>
                    <p className="font-mono-num text-2xl font-bold text-neon-purple">
                      {stats.avgMatched.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">總命中數</p>
                    <p className="font-mono-num text-2xl font-bold text-neon-green">{stats.totalMatched}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                開始模擬後即可查看統計
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
