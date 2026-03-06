import { useDbStats, useSync } from "@/hooks/useBingo";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "predict", label: "號碼預測", icon: "🎯" },
  { id: "latest", label: "最新開獎", icon: "🎰" },
  { id: "stats", label: "統計分析", icon: "📊" },
  { id: "history", label: "歷史紀錄", icon: "📋" },
  { id: "simulate", label: "模擬投注", icon: "🎲" },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  const { data: dbStats, refetch: refetchStats } = useDbStats();
  const syncMutation = useSync();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "done">("idle");

  // Auto-refresh dbStats every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchStats();
    }, 30_000);
    return () => clearInterval(interval);
  }, [refetchStats]);

  const handleSync = async () => {
    if (syncMutation.isPending) return;
    setSyncStatus("syncing");
    try {
      const result = await syncMutation.mutateAsync({ days: 3 });
      setSyncStatus("done");
      toast.success(`同步完成！已更新 ${result.synced} 筆資料`);
      // Reset status after 3 seconds
      setTimeout(() => setSyncStatus("idle"), 3000);
    } catch {
      setSyncStatus("idle");
      toast.error("同步失敗，請稍後再試");
    }
  };

  const getSyncButtonText = () => {
    switch (syncStatus) {
      case "syncing":
        return "同步中...";
      case "done":
        return "已完成";
      default:
        return "同步";
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      {/* Top bar */}
      <div className="mx-auto max-w-3xl px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-neon-blue" />
              <h1 className="font-display text-lg font-bold tracking-wider text-foreground">
                BINGO<span className="text-neon-blue">預測</span>
              </h1>
            </div>
            <span className="rounded-full bg-neon-purple/20 px-2 py-0.5 text-[10px] font-mono-num text-neon-purple">
              v3.0
            </span>
          </div>

          <div className="flex items-center gap-2">
            {dbStats && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg bg-secondary px-2.5 py-1 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span className="font-mono-num">{dbStats.total_draws}</span>
                <span>期</span>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncMutation.isPending}
              className={cn(
                "h-8 gap-1.5 border-neon-blue/30 text-xs transition-all",
                syncStatus === "done"
                  ? "border-green-500/50 text-green-400 hover:bg-green-500/10"
                  : "hover:bg-neon-blue/10 hover:text-neon-blue"
              )}
            >
              <RefreshCw
                className={cn(
                  "h-3.5 w-3.5",
                  syncStatus === "syncing" && "animate-spin"
                )}
              />
              <span className="hidden sm:inline">{getSyncButtonText()}</span>
            </Button>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="-mb-px flex gap-0 overflow-x-auto pb-0 scrollbar-none">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1 border-b-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "border-neon-blue text-neon-blue"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <span className="text-sm sm:text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
