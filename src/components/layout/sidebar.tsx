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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/10 text-white"
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
          "fixed top-0 left-0 z-40 h-full w-64 bg-[#0A0A0A] border-r border-white/10 flex flex-col transition-transform duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)",
          "lg:translate-x-0 overflow-hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-accent to-pink-500 flex items-center justify-center shadow-lg">
              <Activity size={18} className="text-white relative z-10" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight text-white drop-shadow-sm">ClearPath</span>
          </div>
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-medium",
                  isActive
                    ? "bg-white/10 text-white shadow-inner border border-white/5"
                    : "text-white/60 hover:bg-white/5 hover:text-white"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User area */}
        <div className="p-4 m-4 rounded-2xl bg-white/5 border border-white/10 mt-auto shadow-inner">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-charcoal-muted to-neutral-700 flex items-center justify-center text-white/80 font-semibold shadow-md border border-white/10">
              N
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Alex Morgan</p>
              <p className="text-xs text-white/50 truncate">PPO Gold Plan</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
