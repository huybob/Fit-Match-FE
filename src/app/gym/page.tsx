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

const BOOKING_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  PENDING_PAYMENT: "Chờ thanh toán",
  PENDING_GYM: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  REJECTED: "Từ chối",
  CANCELLED: "Đã hủy",
  NO_SHOW: "Vắng mặt",
  COMPLETED: "Hoàn tất",
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function GymDashboardPage() {
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
    { label: "Booking (30 ngày)", value: r ? String(r.totalBookings) : "…", icon: CalendarCheck2, iconBg: "bg-blue-500" },
    { label: "Hoàn tất", value: r ? String(byStatus.COMPLETED ?? 0) : "…", icon: ShieldCheck, iconBg: "bg-green-500" },
    { label: "Đã hủy / vắng mặt", value: r ? String((byStatus.CANCELLED ?? 0) + (byStatus.NO_SHOW ?? 0)) : "…", icon: XCircle, iconBg: "bg-red-500" },
    { label: "Đã giải ngân (net)", value: r ? formatCurrency(r.releasedNet) : "…", icon: DollarSign, iconBg: "bg-purple-500" },
    { label: "Ví khả dụng", value: r?.walletAvailable != null ? formatCurrency(r.walletAvailable) : "…", icon: WalletCards, iconBg: "bg-orange-500" },
  ];

  const verified = verification.data?.verificationStatus === "APPROVED";

  return (
    <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <WorkspaceHeader />

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Welcome banner */}
          <div className="flex items-center justify-between bg-card rounded-2xl border border-border px-6 py-4 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-foreground">Chào mừng trở lại, {displayName}!</h1>
              <div className="flex items-center gap-2 mt-1.5">
                {verification.isLoading ? (
                  <span className="text-xs text-muted-foreground">Đang tải trạng thái…</span>
                ) : verified ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-semibold">
                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" /> Đã xác minh
                  </span>
                ) : (
                  <Link href="/gym/verification" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[11px] font-semibold hover:bg-amber-200">
                    <Clock className="size-3" /> Chưa xác minh — hoàn tất hồ sơ
                  </Link>
                )}
              </div>
            </div>
            <Link href="/gym/bookings"
              className="flex items-center gap-2 h-9 px-5 bg-primary hover:bg-primary/90 text-white text-sm font-semibold rounded-xl transition-colors shadow-md shadow-blue-200">
              <Plus className="size-4" /> Quản lý đặt lịch
            </Link>
          </div>

          {/* Stats row — dữ liệu thật 30 ngày */}
          {report.isError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-sm text-red-700">
              Không tải được báo cáo vận hành. Thử lại sau.
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
              <h2 className="text-sm font-bold text-foreground mb-4">Booking theo trạng thái (30 ngày)</h2>
              {report.isLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              ) : Object.keys(byStatus).length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có booking nào trong kỳ.</p>
              ) : (
                <ul className="space-y-2">
                  {Object.entries(byStatus).map(([status, count]) => (
                    <li key={status} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{BOOKING_STATUS_LABEL[status] ?? status}</span>
                      <span className="font-bold text-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/gym/revenue" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                Xem báo cáo doanh thu đầy đủ →
              </Link>
            </section>

            {/* Booking gần nhất */}
            <section className="bg-card rounded-2xl border border-border p-6 shadow-sm">
              <h2 className="text-sm font-bold text-foreground mb-4">Booking gần nhất</h2>
              {recentBookings.isLoading ? (
                <div className="h-24 animate-pulse rounded-xl bg-muted" />
              ) : !(recentBookings.data?.content ?? []).length ? (
                <p className="text-sm text-muted-foreground">Chưa có booking nào.</p>
              ) : (
                <ul className="space-y-2">
                  {(recentBookings.data?.content ?? []).map((b) => (
                    <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          #{b.id} · {b.customerUsername ?? "—"} · {b.serviceName ?? b.packageName ?? "Buổi từ gói"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {b.startAt ? new Date(b.startAt).toLocaleString("vi-VN") : "—"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {BOOKING_STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/gym/bookings" className="mt-4 inline-block text-xs font-semibold text-primary hover:underline">
                Xem tất cả →
              </Link>
            </section>
          </div>
        </div>
    </main>
  );
}
