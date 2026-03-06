import { useState } from "react";
import Header from "@/components/Header";
import PredictTab from "./PredictTab";
import LatestTab from "./LatestTab";
import StatsTab from "./StatsTab";
import HistoryTab from "./HistoryTab";
import SimulateTab from "./SimulateTab";

const HERO_BG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663030293983/mhBYLdSLEBjgwNemRp68Rr/hero-bg-AFxqPFz8T99g5zJRcQgvKa.webp";

export default function Home() {
  const [activeTab, setActiveTab] = useState("predict");

  const renderTab = () => {
    switch (activeTab) {
      case "predict":
        return <PredictTab />;
      case "latest":
        return <LatestTab />;
      case "stats":
        return <StatsTab />;
      case "history":
        return <HistoryTab />;
      case "simulate":
        return <SimulateTab />;
      default:
        return <PredictTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background decoration */}
      <div
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          backgroundImage: `url(${HERO_BG})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-3xl px-4 py-6">
        {renderTab()}
      </main>

      {/* Footer disclaimer */}
      <footer className="border-t border-border/30 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground leading-relaxed">
            本網站僅供娛樂參考，不構成任何投注建議。
            <br />
            彩券中獎機率極低，請理性消費，量力而為。
            <br />
            <span className="text-neon-blue/50">BINGO 預測器 v3.0</span>
            {" | "}
            <span className="text-muted-foreground/50">資料來源：台灣彩券</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
