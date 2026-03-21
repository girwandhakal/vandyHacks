import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { direction: "up" | "down"; value: string };
  className?: string;
}

export function StatCard({ label, value, subtitle, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn("card-base", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm text-neutral-500">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-neutral-400">{subtitle}</p>}
        </div>
        {icon && <div className="text-neutral-400">{icon}</div>}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          <span className={trend.direction === "up" ? "text-danger" : "text-success"}>
            {trend.direction === "up" ? "↑" : "↓"} {trend.value}
          </span>
          <span className="text-neutral-400">vs last month</span>
        </div>
      )}
    </div>
  );
}
