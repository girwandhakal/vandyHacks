"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MessageSquare,
  Shield,
  FileText,
  Calculator,
  GitBranch,
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
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    if (pendingHref === pathname) {
      setPendingHref(null);
    }
  }, [pathname, pendingHref]);

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
            const isActive = (pendingHref ?? pathname) === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => router.prefetch(item.href)}
                onFocus={() => router.prefetch(item.href)}
                onPointerDown={() => setPendingHref(item.href)}
                onClick={() => {
                  setPendingHref(item.href);
                  setMobileOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    setPendingHref(item.href);
                  }
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-[background-color,border-color,color,transform,box-shadow] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
                  isActive
                    ? "border-white/10 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_12px_24px_rgba(0,0,0,0.16)]"
                    : "border-transparent text-white/60 hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.07] hover:text-white"
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    "transition-transform duration-200 ease-out",
                    isActive ? "text-white" : "group-hover:translate-x-0.5"
                  )}
                />
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
