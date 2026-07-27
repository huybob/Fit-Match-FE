"use client";

import { formatCurrency } from "@/utils/format.util";
import { useQuery } from "@tanstack/react-query";
import { Gift, Sparkles } from "lucide-react";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { loyaltyService } from "@/services/loyalty.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

/* Nhãn nằm ở member.loyalty.type.* — key trùng tên enum nên gọi động được. */

// F-28: dùng formatter chung — hết copy-paste Intl.NumberFormat.
const money = (v?: number) => formatCurrency(v ?? 0);


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
  const t = useTranslations();
  const fmt = useFormatters();
  const query = useQuery({ queryKey: ["loyalty"], queryFn: () => loyaltyService.balance() });
  const data = query.data;
  const txns = data?.history?.content ?? [];

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError || !data) return <EmptyState title={t("member.loyalty.loadError")} description={toErrorMessage(query.error)} />;

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <Sparkles className="size-4 text-accent" /> {t("member.loyalty.title")}
        </div>
        <p className="mt-2 text-5xl font-black">{data.pointsBalance}<span className="ml-2 text-lg text-muted-foreground">{t("member.loyalty.points")}</span></p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("member.loyalty.rate", {
            pointValue: money(data.pointValue),
            vndPerPoint: money(data.vndPerPoint),
          })}{" "}
          {t("member.loyalty.useHint")}
        </p>
      </section>

      <h2 className="mb-3 text-lg font-black">{t("member.loyalty.history")}</h2>
      {!txns.length ? (
        <EmptyState title={t("member.loyalty.noTxn")} description={t("member.loyalty.noTxnHint")} />
      ) : (
        <ul className="space-y-2">
          {txns.map((txn) => (
            <li key={txn.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
              <div>
                <p className="flex items-center gap-2 font-bold">
                  <Gift className="size-4 text-primary" />{t(`member.loyalty.type.${txn.type}`)}
                  {txn.bookingId ? <span className="text-xs text-muted-foreground">· Booking #{txn.bookingId}</span> : null}
                </p>
                <p className="text-xs text-muted-foreground">{fmt.dateTimeShort(txn.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className={`font-black ${txn.points >= 0 ? "text-success" : "text-destructive"}`}>
                  {txn.points >= 0 ? "+" : ""}{txn.points}
                </p>
                <p className="text-xs text-muted-foreground">{t("member.loyalty.balance")} {txn.balanceAfter}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
