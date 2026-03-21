"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Shield,
  FileText,
  Calculator,
  GitBranch,
  Lightbulb,
  Settings,
  Menu,
  X,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
  { href: "/insurance", label: "Insurance", icon: Shield },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/cost-estimator", label: "Cost Estimator", icon: Calculator },
  { href: "/scenarios", label: "Scenarios", icon: GitBranch },
  { href: "/insights", label: "Insights", icon: Lightbulb },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white border border-neutral-200 text-charcoal"
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-200 ease-out",
          "lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-neutral-100">
          <div className="w-8 h-8 rounded-lg bg-charcoal flex items-center justify-center">
            <Activity size={16} className="text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-charcoal">ClearPath</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                  isActive
                    ? "bg-charcoal text-white"
                    : "text-neutral-500 hover:text-charcoal hover:bg-neutral-50"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="px-4 py-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-accent text-sm font-semibold">
              A
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal truncate">Alex Morgan</p>
              <p className="text-xs text-neutral-400 truncate">PPO Gold Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
