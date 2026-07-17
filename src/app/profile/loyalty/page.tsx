"use client";

import { formatCurrency } from "@/utils/format.util";
import { useQuery } from "@tanstack/react-query";
import { Gift, Sparkles } from "lucide-react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { loyaltyService, type LoyaltyTxnType } from "@/services/loyalty.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";

const typeLabels: Record<LoyaltyTxnType, string> = {
  EARN: "Tích điểm",
  REDEEM: "Dùng điểm",
  REFUND: "Hoàn điểm",
};

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);

function timeText(v?: string) {
  return v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(v)) : "";
}

export default function LoyaltyRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
          <LoyaltyContent />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}

function LoyaltyContent() {
  const query = useQuery({ queryKey: ["loyalty"], queryFn: () => loyaltyService.balance() });
  const data = query.data;
  const txns = data?.history?.content ?? [];

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError || !data) return <EmptyState title="Không tải được điểm thưởng" description={toErrorMessage(query.error)} />;

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-4 text-accent" /> Điểm thưởng của bạn
        </div>
        <p className="mt-2 text-5xl font-black">{data.pointsBalance}<span className="ml-2 text-lg text-muted-foreground">điểm</span></p>
        <p className="mt-2 text-sm text-muted-foreground">
          Quy đổi: 1 điểm = {money(data.pointValue)} · Tích {money(data.vndPerPoint)} chi tiêu = 1 điểm.
          Dùng điểm để giảm giá khi đặt lịch.
        </p>
      </section>

      <h2 className="mb-3 text-lg font-black">Lịch sử điểm</h2>
      {!txns.length ? (
        <EmptyState title="Chưa có giao dịch điểm" description="Hoàn tất buổi tập để bắt đầu tích điểm." />
      ) : (
        <ul className="space-y-2">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="flex items-center gap-2 font-bold">
                  <Gift className="size-4 text-primary" />{typeLabels[t.type]}
                  {t.bookingId ? <span className="text-xs text-muted-foreground">· Booking #{t.bookingId}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{timeText(t.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className={`font-black ${t.points >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                  {t.points >= 0 ? "+" : ""}{t.points}
                </p>
                <p className="text-xs text-muted-foreground">Số dư: {t.balanceAfter}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
