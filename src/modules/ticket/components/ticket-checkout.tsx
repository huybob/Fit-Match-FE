"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { QrCode, Ticket as TicketIcon } from "lucide-react";
import { formatCurrency } from "@/utils/format.util";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import {
  useBranchTicketTypes,
  usePurchaseTicket,
  useTicketPayment,
  useTicketQuote,
} from "../hooks/use-ticket";
import type { TicketQuoteRequest } from "@/types/Ticket";

/**
 * Mua vé — một trang duy nhất, không còn wizard nhiều bước.
 *
 * Mọi thay đổi (toggle PT, mã voucher, toggle điểm) đều gọi lại /tickets/quote
 * để con số hiển thị luôn là con số server sẽ thu. FE KHÔNG tự tính giá.
 */
export function TicketCheckoutPage() {
  const t = useTranslations("ticket.checkout");
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const branchId = Number(params.get("branchId") ?? 0);
  const preselectedTypeId = Number(params.get("ticketTypeId") ?? 0);

  const [ticketTypeId, setTicketTypeId] = useState(preselectedTypeId);
  const [withPt, setWithPt] = useState(false);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [purchasedTicketId, setPurchasedTicketId] = useState<number | null>(null);

  const { data: types, isLoading: typesLoading } = useBranchTicketTypes(branchId);

  const quotePayload = useMemo<TicketQuoteRequest | null>(
    () =>
      branchId && ticketTypeId
        ? {
            branchId,
            ticketTypeId,
            withPt,
            voucherCode: appliedVoucher || undefined,
            useLoyaltyPoints,
          }
        : null,
    [branchId, ticketTypeId, withPt, appliedVoucher, useLoyaltyPoints],
  );

  const { data: quote, isFetching: quoting } = useTicketQuote(quotePayload);
  const purchase = usePurchaseTicket();

  const selectedType = types?.find((type) => type.id === ticketTypeId);
  // Vé không kèm phụ phí PT thì toggle "có PT" là vô nghĩa — ẩn hẳn.
  const ptAvailable = Boolean(selectedType?.ptSurchargePerDay);

  if (!branchId) {
    return <EmptyState title={t("noBranch")} description={t("noBranchHint")} />;
  }
  if (typesLoading) return <LoadingSkeleton />;
  if (!types?.length) {
    return <EmptyState title={t("noTickets")} description={t("noTicketsHint")} />;
  }

  // Đã mua xong và còn phải chuyển khoản -> chuyển sang màn QR.
  if (purchasedTicketId) {
    return <TicketPaymentPanel ticketId={purchasedTicketId} />;
  }

  async function handlePurchase() {
    if (!quotePayload) return;
    try {
      const result = await purchase.mutateAsync(quotePayload);
      // Câu 14: điểm/voucher phủ hết -> vé ACTIVE ngay, bỏ qua bước QR.
      if (!result.paymentOrder) {
        toast({ type: "success", title: t("activatedImmediately") });
        router.push(`/schedule?ticketId=${result.ticket.id}`);
        return;
      }
      setPurchasedTicketId(result.ticket.id);
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>

        <div className="grid gap-3">
          {types.map((type) => {
            const selected = type.id === ticketTypeId;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  setTicketTypeId(type.id);
                  if (!type.ptSurchargePerDay) setWithPt(false);
                }}
                className={`rounded-lg border p-4 text-left transition ${
                  selected ? "border-primary bg-primary/5" : "hover:border-primary/50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{type.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {type.kind === "DAY"
                        ? t("dayTicket")
                        : t("packageTicket", { days: type.dayCount })}
                    </p>
                    {type.description ? (
                      <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(type.price)}</p>
                    {type.ptSurchargePerDay ? (
                      <p className="text-xs text-muted-foreground">
                        {t("withPtPrice", { price: formatCurrency(type.priceWithPt) })}
                      </p>
                    ) : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedType ? (
          <div className="space-y-4 rounded-lg border p-4">
            {ptAvailable ? (
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium">{t("withPt")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("withPtHint", {
                      surcharge: formatCurrency(selectedType.ptSurchargePerDay ?? 0),
                      days: selectedType.dayCount,
                    })}
                  </span>
                </span>
                <Switch checked={withPt} onCheckedChange={setWithPt} />
              </label>
            ) : null}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t("voucher")}</label>
              <div className="flex gap-2">
                <Input
                  value={voucherInput}
                  onChange={(event) => setVoucherInput(event.target.value)}
                  placeholder={t("voucherPlaceholder")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAppliedVoucher(voucherInput.trim())}
                >
                  {t("applyVoucher")}
                </Button>
              </div>
              {/* Mã sai KHÔNG chặn xem giá — chỉ giải thích ngay dưới ô nhập. */}
              {quote?.voucherMessage ? (
                <p className="text-sm text-amber-600">{quote.voucherMessage}</p>
              ) : null}
            </div>

            {quote && quote.loyaltyPointsAvailable > 0 ? (
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="block font-medium">{t("useLoyalty")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {t("useLoyaltyHint", { points: quote.loyaltyPointsAvailable })}
                  </span>
                </span>
                <Switch checked={useLoyaltyPoints} onCheckedChange={setUseLoyaltyPoints} />
              </label>
            ) : null}
          </div>
        ) : null}
      </section>

      <aside className="h-fit space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">{t("summary")}</h2>
        {quote ? (
          <dl className="space-y-2 text-sm">
            <Row label={t("total")} value={formatCurrency(quote.totalAmount)} />
            {quote.voucherDiscount > 0 ? (
              <Row
                label={t("voucherDiscount")}
                value={`- ${formatCurrency(quote.voucherDiscount)}`}
              />
            ) : null}
            {quote.loyaltyDiscount > 0 ? (
              <Row
                label={t("loyaltyDiscount", { points: quote.loyaltyPointsUsed })}
                value={`- ${formatCurrency(quote.loyaltyDiscount)}`}
              />
            ) : null}
            <div className="border-t pt-2">
              <Row
                label={t("payable")}
                value={formatCurrency(quote.payableAmount)}
                emphasis
              />
            </div>
            {quote.payableAmount === 0 ? (
              <p className="text-sm text-emerald-600">{t("fullyCovered")}</p>
            ) : null}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">{t("pickTicket")}</p>
        )}

        <Button
          className="w-full"
          disabled={!quote || quoting || purchase.isPending}
          onClick={handlePurchase}
        >
          <TicketIcon className="mr-2 size-4" />
          {t("buy")}
        </Button>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className={`flex justify-between ${emphasis ? "text-base font-semibold" : ""}`}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

/** Màn QR — poll 5s tới khi webhook Casso xác nhận, rồi tự chuyển sang đặt lịch. */
function TicketPaymentPanel({ ticketId }: { ticketId: number }) {
  const t = useTranslations("ticket.checkout");
  const router = useRouter();
  const { data: order, isLoading } = useTicketPayment(ticketId);

  if (isLoading) return <LoadingSkeleton />;
  if (!order) return <EmptyState title={t("noPaymentOrder")} description={t("pollingHint")} />;

  if (order.status === "PAID") {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <Badge>{t("paid")}</Badge>
        <p>{t("paidHint")}</p>
        <Button onClick={() => router.push(`/schedule?ticketId=${ticketId}`)}>
          {t("goSchedule")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-xl font-semibold">{t("scanToPay")}</h1>
      <p className="text-2xl font-bold">{formatCurrency(order.amount)}</p>
      {order.qrContent ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={order.qrContent} alt={t("qrAlt")} className="mx-auto w-64" />
      ) : (
        <QrCode className="mx-auto size-24 text-muted-foreground" />
      )}
      <p className="text-sm text-muted-foreground">
        {t("refCode")}: <span className="font-mono">{order.refCode}</span>
      </p>
      <p className="text-sm text-muted-foreground">{t("pollingHint")}</p>
    </div>
  );
}
