"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number;
  max: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className,
  label,
  sublabel,
}: ProgressRingProps) {
  const percent = Math.min((value / max) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  const getColor = () => {
    if (percent >= 80) return "#DC2626";
    if (percent >= 50) return "#D97706";
    return "#2563EB";
  };

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
        />
      </svg>
      {label && (
        <div className="text-center -mt-1">
          <p className="text-sm font-medium text-charcoal">{label}</p>
          {sublabel && <p className="text-xs text-neutral-400">{sublabel}</p>}
        </div>
      )}
    </div>
  );
}
