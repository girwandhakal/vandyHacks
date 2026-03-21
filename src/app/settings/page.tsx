"use client";

import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { mockUser } from "@/lib/mock/user";
import {
  Shield,
  Landmark,
  Wallet,
  CreditCard,
  Bell,
  Mail,
  Moon,
  Lock,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
} from "lucide-react";

const accountIcons: Record<string, React.ElementType> = {
  insurance: Shield,
  bank: Landmark,
  hsa: Wallet,
  fsa: CreditCard,
};

const statusConfig: Record<string, { variant: "success" | "danger" | "warning"; icon: React.ElementType }> = {
  connected: { variant: "success", icon: CheckCircle2 },
  disconnected: { variant: "danger", icon: XCircle },
  pending: { variant: "warning", icon: Clock },
};

export default function SettingsPage() {
  const user = mockUser;

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader title="Settings" subtitle="Manage your account, connections, and preferences" />
      </AnimateIn>

      {/* Profile section */}
      <AnimateIn delay={0.05}>
        <div className="card-base mb-6">
          <h3 className="section-title mb-4">Profile</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent-muted flex items-center justify-center text-accent text-xl font-semibold">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="text-base font-semibold text-charcoal">{user.name}</p>
              <p className="text-sm text-neutral-500">{user.email}</p>
            </div>
          </div>
        </div>
      </AnimateIn>

      {/* Connected accounts */}
      <AnimateIn delay={0.1}>
        <div className="card-base mb-6">
          <h3 className="section-title mb-4">Connected Accounts</h3>
          <div className="space-y-3">
            {user.connectedAccounts.map((account) => {
              const Icon = accountIcons[account.type] || CreditCard;
              const status = statusConfig[account.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center">
                    <Icon size={18} className="text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal">{account.label}</p>
                    {account.lastSync && (
                      <p className="text-xs text-neutral-400">
                        Last synced {new Date(account.lastSync).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge label={account.status} variant={status.variant} />
                    <ChevronRight size={14} className="text-neutral-300" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </AnimateIn>

      {/* Preferences */}
      <AnimateIn delay={0.15}>
        <div className="card-base mb-6">
          <h3 className="section-title mb-4">Preferences</h3>
          <div className="space-y-1">
            {[
              { icon: Bell, label: "Push Notifications", value: user.preferences.notifications },
              { icon: Mail, label: "Email Digest", value: user.preferences.emailDigest },
              { icon: Moon, label: "Dark Mode", value: user.preferences.darkMode },
            ].map((pref) => (
              <div
                key={pref.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <pref.icon size={16} className="text-neutral-400" />
                  <span className="text-sm text-charcoal">{pref.label}</span>
                </div>
                <div
                  className={`w-10 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors ${
                    pref.value ? "bg-charcoal" : "bg-neutral-200"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      pref.value ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>

      {/* Privacy & Data */}
      <AnimateIn delay={0.2}>
        <div className="card-base">
          <h3 className="section-title mb-4">Privacy & Data</h3>
          <div className="space-y-1">
            {[
              { icon: Lock, label: "Privacy & Consent", subtitle: "Manage data sharing preferences" },
              { icon: Download, label: "Export Data", subtitle: "Download your healthcare data" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="text-neutral-400" />
                  <div>
                    <p className="text-sm text-charcoal">{item.label}</p>
                    <p className="text-xs text-neutral-400">{item.subtitle}</p>
                  </div>
                </div>
                <ChevronRight size={14} className="text-neutral-300" />
              </div>
            ))}
          </div>
        </div>
      </AnimateIn>
    </div>
  );
}
