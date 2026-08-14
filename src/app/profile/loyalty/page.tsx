"use client";

import { formatCurrency } from "@/utils/format.util";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Gift, HelpCircle, Sparkles } from "lucide-react";
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

      {/* Bug S2-12: tester phản hồi "chưa hiểu chỗ điểm tiêu dùng" — dòng quy đổi
          nói được TỶ LỆ nhưng không nói điểm đến từ đâu và tiêu ở đâu. Tách rõ
          "tích" / "tiêu" / "lưu ý" kèm lối đi thẳng tới chỗ dùng điểm. */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-muted-foreground">
          <HelpCircle className="size-4 text-primary" /> {t("member.loyalty.howItWorks")}
        </h2>
        <ol className="mt-3 space-y-2.5 text-sm text-muted-foreground">
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-black text-primary">1</span>
            <span>{t("member.loyalty.step1", { vndPerPoint: money(data.vndPerPoint) })}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-black text-primary">2</span>
            <span>{t("member.loyalty.step2", { pointValue: money(data.pointValue) })}</span>
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-black text-primary">3</span>
            <span>{t("member.loyalty.step3")}</span>
          </li>
        </ol>
        <Link
          href="/gyms"
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Sparkles className="size-4" /> {t("member.loyalty.usePointsCta")}
        </Link>
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
                  {txn.ticketId ? <span className="text-xs text-muted-foreground">· Vé #{txn.ticketId}</span> : null}
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
