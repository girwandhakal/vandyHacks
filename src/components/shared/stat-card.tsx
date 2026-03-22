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
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{label}</p>
          <p className="text-4xl font-extrabold tracking-tight text-charcoal">{value}</p>
          {subtitle && <p className="text-xs font-medium text-neutral-400 mt-1">{subtitle}</p>}
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
