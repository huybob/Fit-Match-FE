"use client";

// B-36 (audit 2026-07-17): dashboard cũ 100% mock (doanh thu "125.4M +42.4%", chi nhánh
// giả, booking giả, bar chart cứng). Thay bằng dữ liệu thật: báo cáo vận hành 30 ngày
// (/gym/reports/operational) + ví (/gym/wallet) + booking gần nhất (/gym/bookings).

import Link from "next/link";
import { useMemo } from "react";
import {
  CalendarCheck2, DollarSign, WalletCards,
  Plus, XCircle, Clock, ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/modules/auth/auth.store";
import { gymService } from "@/services/gym.service";
import { reportService } from "@/services/report.service";
import { bookingService } from "@/services/booking.service";
import { formatCurrency } from "@/utils/format.util";
import { WorkspaceHeader } from "@/shared/components/common/workspace-header";
import { useTranslations } from "next-intl";
import type { BookingStatus } from "@/types/Booking";
import { useFormatters } from "@/i18n/use-formatters";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function GymDashboardPage() {
  const t = useTranslations();
  const fmt = useFormatters();
  const { user } = useAuthStore();
  const displayName = user?.fullName ?? user?.username ?? "Gym";

  // Cửa sổ 30 ngày gần nhất — tính một lần mỗi mount.
  const range = useMemo(() => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 30);
    return { from: isoDate(from), to: isoDate(to) };
  }, []);

  const verification = useQuery({
    queryKey: ["gym-verification-status"],
    queryFn: gymService.getVerificationStatus,
  });
  const report = useQuery({
    queryKey: ["gym-report", range.from, range.to],
    queryFn: () => reportService.gym(range.from, range.to),
  });
  const recentBookings = useQuery({
    queryKey: ["gym-bookings", "recent"],
    queryFn: () => bookingService.getGym({ page: 0, size: 5 }),
  });

  const r = report.data;
  const byStatus = r?.bookingsByStatus ?? {};
  const stats = [
    { label: t("gym.dashboard.bookings30d"), value: r ? String(r.totalBookings) : "…", icon: CalendarCheck2, iconBg: "bg-primary" },
    { label: t("common.bookingStatus.COMPLETED"), value: r ? String(byStatus.COMPLETED ?? 0) : "…", icon: ShieldCheck, iconBg: "bg-success" },
    { label: t("gym.dashboard.cancelledNoShow"), value: r ? String((byStatus.CANCELLED ?? 0) + (byStatus.NO_SHOW ?? 0)) : "…", icon: XCircle, iconBg: "bg-destructive" },
    { label: t("gym.dashboard.paidOutNet"), value: r ? formatCurrency(r.releasedNet) : "…", icon: DollarSign, iconBg: "bg-info" },
    { label: t("gym.dashboard.walletAvailable"), value: r?.walletAvailable != null ? formatCurrency(r.walletAvailable) : "…", icon: WalletCards, iconBg: "bg-warning" },
  ];

  const verified = verification.data?.verificationStatus === "APPROVED";

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <WorkspaceHeader />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Welcome banner */}
          <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-foreground">{t("gym.dashboard.welcome", { name: displayName })}</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {verification.isLoading ? (
                  <span className="text-xs text-muted-foreground">{t("gym.dashboard.loadingStatus")}</span>
                ) : verified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-muted text-success text-[11px] font-semibold">
                    <span className="size-1.5 rounded-full bg-success inline-block" /> {t("gym.dashboard.verified")}
                  </span>
                ) : (
                  <Link href="/gym/verification" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning-muted text-warning text-[11px] font-semibold hover:bg-warning">
                    <Clock className="size-3" /> {t("gym.dashboard.notVerified")}
                  </Link>
                )}
              </div>
            </div>
            <Link href="/gym/bookings"
              className="flex items-center gap-2 h-9 px-5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-xl transition-colors shadow-md shadow-primary/20">
              <Plus className="size-4" /> {t("gym.dashboard.manageBookings")}
            </Link>
          </div>

          {/* Stats row — dữ liệu thật 30 ngày */}
          {report.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-6 py-4 text-sm text-destructive">
              {t("gym.dashboard.reportError")}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {stats.map(({ label, value, icon: Icon, iconBg }) => (
                <div key={label} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                  <div className={`size-9 rounded-xl ${iconBg} flex items-center justify-center mb-3`}>
                    <Icon className="size-4 text-white" />
                  </div>
                  <p className="text-lg font-black text-foreground truncate" title={value}>{value}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Booking theo trạng thái */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4">{t("gym.dashboard.byStatus")}</h2>
              {report.isLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              ) : Object.keys(byStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("gym.dashboard.noBookingsPeriod")}</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(byStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t(`common.bookingStatus.${status as BookingStatus}`)}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/gym/revenue" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                {t("gym.dashboard.fullRevenueReport")}
              </Link>
            </section>

            {/* {t("gym.dashboard.recentBookings")} */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4">{t("gym.dashboard.recentBookings")}</h2>
              {recentBookings.isLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              ) : !(recentBookings.data?.content ?? []).length ? (
                <p className="text-sm text-muted-foreground">{t("gym.dashboard.noBookings")}</p>
              ) : (
                <ul className="space-y-2">
                  {(recentBookings.data?.content ?? []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          #{b.id} · {b.customerUsername ?? "—"} · {b.serviceName ?? b.packageName ?? t("gym.dashboard.fromPackage")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmt.dateTime(b.startAt)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {t(`common.bookingStatus.${b.status}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/gym/bookings" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                {t("gym.dashboard.viewAll")}
              </Link>
            </section>
          </div>
        </div>
    </main>
  );
}
