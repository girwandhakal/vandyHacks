"use client";

import { useState } from "react";
import { AnimateIn } from "@/components/shared/animate-in";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Skeleton } from "@/components/shared/skeleton";
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
};

const statusConfig: Record<string, { variant: "success" | "danger" | "warning"; icon: React.ElementType }> = {
  connected: { variant: "success", icon: CheckCircle2 },
  disconnected: { variant: "danger", icon: XCircle },
  pending: { variant: "warning", icon: Clock },
};

export function SettingsPageClient({ initialUser }: { initialUser: any }) {
  const [user, setUser] = useState<any>(initialUser);
  const [loading] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [updatingAccountId, setUpdatingAccountId] = useState<string | null>(null);
  const [accountTransactions, setAccountTransactions] = useState<Record<string, any[]>>({});
  const [loadingTransactions, setLoadingTransactions] = useState<Record<string, boolean>>({});

  const toggleAccountDetails = async (accountId: string) => {
    const nextId = expandedAccountId === accountId ? null : accountId;
    setExpandedAccountId(nextId);

    if (nextId && !accountTransactions[accountId]) {
      setLoadingTransactions((prev) => ({ ...prev, [accountId]: true }));
      try {
        const res = await fetch(`/api/settings/accounts/${accountId}/transactions`);
        if (!res.ok) throw new Error("Transaction fetch failed");
        const json = await res.json();
        setAccountTransactions((prev) => ({ ...prev, [accountId]: json.transactions || [] }));
      } catch (err) {
        console.error(err);
        setAccountTransactions((prev) => ({ ...prev, [accountId]: [] }));
      } finally {
        setLoadingTransactions((prev) => ({ ...prev, [accountId]: false }));
      }
    }
  };

  const handleAccountAction = async (accountId: string, action: "connect" | "disconnect") => {
    setUpdatingAccountId(accountId);
    try {
      const res = await fetch("/api/settings/accounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, action }),
      });
      if (!res.ok) throw new Error("Account update failed");
      const updated = await res.json();
      setUser((prev: any) => ({
        ...prev,
        connectedAccounts: prev.connectedAccounts.map((acct: any) =>
          acct.id === updated.id ? { ...acct, ...updated } : acct,
        ),
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingAccountId(null);
    }
  };

  const togglePreference = async (key: string) => {
    if (!user) return;

    const newValue = !user.preferences[key];

    setUser((prev: any) => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: newValue },
    }));

    try {
      const res = await fetch("/api/settings/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: newValue }),
      });
      if (!res.ok) throw new Error("API call failed");
    } catch (err) {
      console.error(err);
      setUser((prev: any) => ({
        ...prev,
        preferences: { ...prev.preferences, [key]: !newValue },
      }));
    }
  };

  if (loading || !user) {
    return (
      <div className="page-container space-y-6">
        <Skeleton className="h-24 w-3/4 mb-4" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="page-container">
      <AnimateIn>
        <PageHeader title="Settings" subtitle="Manage your account, connections, and preferences" />
      </AnimateIn>

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

      <AnimateIn delay={0.1}>
        <div className="card-base mb-6">
          <h3 className="section-title mb-4">Connected Accounts</h3>
          {user.connectedAccounts?.length === 0 ? (
            <p className="text-sm text-neutral-500 py-2">No connected accounts yet.</p>
          ) : (
            <div className="space-y-3">
              {user.connectedAccounts?.map((account: any) => {
                const Icon = accountIcons[account.type] || CreditCard;
                const status = statusConfig[account.status] || statusConfig.disconnected;
                const displayLabel =
                  account.type === "insurance"
                    ? "ISO Student Insurance"
                    : (account.label || account.providerName || "Account");

                return (
                  <div
                    key={account.id}
                    className="rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
                    onClick={() => toggleAccountDetails(account.id)}
                  >
                    <div className="flex items-center gap-4 p-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-50 flex items-center justify-center">
                        <Icon size={18} className="text-neutral-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal">{displayLabel}</p>
                        {account.lastSync && (
                          <p className="text-xs text-neutral-400">
                            Last synced {new Date(account.lastSync).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {typeof account.balance === "number" ? `Balance $${account.balance.toFixed(2)}` : "Balance unavailable"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge label={account.status} variant={status.variant} />
                        <ChevronRight size={14} className="text-neutral-300" />
                      </div>
                    </div>

                    {expandedAccountId === account.id && (
                      <div className="px-3 pb-3">
                        <div className="ml-14 border-t border-neutral-100 pt-3">
                          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                            Recent Activity
                          </p>
                          <div className="space-y-2">
                            {loadingTransactions[account.id] ? (
                              <div className="text-xs text-neutral-400">Loading transactions...</div>
                            ) : (accountTransactions[account.id] || []).length === 0 ? (
                              <div className="text-xs text-neutral-400">No recent transactions.</div>
                            ) : (
                              (accountTransactions[account.id] || []).map((tx: any) => (
                                <div key={tx.id} className="flex items-center justify-between text-xs text-neutral-500">
                                  <div className="flex-1 min-w-0">
                                    <span className="text-neutral-600">{tx.description}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span>{new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                    <span className="text-neutral-600">
                                      {tx.amount >= 0 ? `$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                                    </span>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          <div className="mt-3 flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAccountAction(account.id, account.status === "connected" ? "disconnect" : "connect");
                              }}
                              disabled={updatingAccountId === account.id}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-charcoal text-white hover:bg-charcoal-light disabled:opacity-50"
                            >
                              {account.status === "connected" ? "Disconnect" : "Reconnect"}
                            </button>
                            <span className="text-xs text-neutral-400">
                              Status: {account.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </AnimateIn>

      <AnimateIn delay={0.15}>
        <div className="card-base mb-6">
          <h3 className="section-title mb-4">Preferences</h3>
          <div className="space-y-1">
            {[
              { icon: Bell, label: "Push Notifications", key: "notifications", value: user.preferences.notifications },
              { icon: Mail, label: "Email Digest", key: "emailDigest", value: user.preferences.emailDigest },
              { icon: Moon, label: "Dark Mode", key: "darkMode", value: user.preferences.darkMode },
            ].map((pref) => (
              <div
                key={pref.label}
                onClick={() => togglePreference(pref.key)}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <pref.icon size={16} className="text-neutral-400" />
                  <span className="text-sm text-charcoal pointer-events-none">{pref.label}</span>
                </div>
                <div
                  className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
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
