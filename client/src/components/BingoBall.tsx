import { cn } from "@/lib/utils";

interface BingoBallProps {
  number: number;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "hot" | "cold" | "special" | "neutral";
  className?: string;
  showGlow?: boolean;
  style?: React.CSSProperties;
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
};

const variantClasses = {
  default: "bg-secondary border-neon-blue/30 text-foreground",
  hot: "bg-neon-orange/20 border-neon-orange/50 text-neon-orange",
  cold: "bg-neon-blue/20 border-neon-blue/50 text-neon-blue",
  special: "bg-neon-purple/20 border-neon-purple/50 text-neon-purple",
  neutral: "bg-muted border-border text-muted-foreground",
};

const glowClasses = {
  default: "",
  hot: "shadow-[0_0_10px_oklch(0.72_0.2_45/0.3)]",
  cold: "shadow-[0_0_10px_oklch(0.75_0.18_220/0.3)]",
  special: "shadow-[0_0_10px_oklch(0.65_0.25_290/0.3)]",
  neutral: "",
};

export default function BingoBall({
  number,
  size = "md",
  variant = "default",
  className,
  showGlow = false,
  style,
}: BingoBallProps) {
  return (
    <div
      style={style}
      className={cn(
        "inline-flex items-center justify-center rounded-full border font-mono-num font-bold transition-all duration-200",
        sizeClasses[size],
        variantClasses[variant],
        showGlow && glowClasses[variant],
        className
      )}
    >
      {number}
    </div>
  );
}
