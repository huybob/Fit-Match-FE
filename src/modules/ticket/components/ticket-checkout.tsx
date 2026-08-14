"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { QrCode } from "lucide-react";
import { formatCurrency } from "@/utils/format.util";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  useBranchServices,
  useBranchTicketTypes,
  usePurchaseTicket,
  useTicketPayment,
  useTicketQuote,
} from "../hooks/use-ticket";
import {
  ConfirmStep,
  PromoStep,
  PtStep,
  ServicesStep,
  StepIndicator,
  TypeStep,
  useWizardSteps,
  WizardFooter,
} from "./ticket-purchase-wizard";
import type { TicketQuoteRequest, TicketType } from "@/types/Ticket";

/**
 * Mua vé — popup từng bước (V82): loại vé -> huấn luyện viên -> dịch vụ kèm ->
 * ưu đãi -> xác nhận. Bước PT và bước dịch vụ tự ẩn khi chi nhánh không có.
 *
 * Mọi thay đổi (toggle PT, chọn dịch vụ, mã voucher, toggle điểm) đều gọi lại
 * /tickets/quote để con số hiển thị luôn là con số server sẽ thu. FE KHÔNG tự
 * tính giá — kể cả tiền dịch vụ.
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
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [purchasedTicketId, setPurchasedTicketId] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const { data: types, isLoading: typesLoading } = useBranchTicketTypes(branchId);
  const { data: branchServices = [] } = useBranchServices(branchId);

  const quotePayload = useMemo<TicketQuoteRequest | null>(
    () =>
      branchId && ticketTypeId
        ? {
            branchId,
            ticketTypeId,
            withPt,
            voucherCode: appliedVoucher || undefined,
            useLoyaltyPoints,
            serviceIds: serviceIds.length ? serviceIds : undefined,
          }
        : null,
    [branchId, ticketTypeId, withPt, appliedVoucher, useLoyaltyPoints, serviceIds],
  );

  const { data: quote, isFetching: quoting } = useTicketQuote(quotePayload);
  const purchase = usePurchaseTicket();

  const selectedType = types?.find((type) => type.id === ticketTypeId);
  const steps = useWizardSteps(selectedType, branchServices);
  // Bỏ bước giữa chừng (vd đổi sang vé không có PT) làm chỉ số hiện tại vượt
  // mảng — kẹp lại thay vì để render ra bước undefined.
  const currentStep = steps[Math.min(stepIndex, steps.length - 1)];

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

  function toggleService(id: number) {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }

  function selectType(type: TicketType) {
    setTicketTypeId(type.id);
    // Vé mới không có phụ phí PT thì lựa chọn PT cũ không còn nghĩa gì.
    if (!type.ptSurchargePerDay) setWithPt(false);
  }

  return (
    <Dialog open title={t("title")} onClose={() => router.back()}>
      <StepIndicator steps={steps} current={currentStep} />

      {currentStep === "type" && (
        <TypeStep types={types} value={ticketTypeId} onChange={selectType} />
      )}

      {currentStep === "pt" && selectedType && (
        <PtStep selectedType={selectedType} withPt={withPt} onChange={setWithPt} />
      )}

      {currentStep === "services" && (
        <ServicesStep
          services={branchServices}
          selected={serviceIds}
          onToggle={toggleService}
        />
      )}

      {currentStep === "promo" && (
        <PromoStep
          voucherInput={voucherInput}
          onVoucherInput={setVoucherInput}
          onApplyVoucher={() => setAppliedVoucher(voucherInput.trim())}
          quote={quote}
          useLoyaltyPoints={useLoyaltyPoints}
          onUseLoyaltyPoints={setUseLoyaltyPoints}
        />
      )}

      {currentStep === "confirm" && <ConfirmStep quote={quote} />}

      <WizardFooter
        isFirst={stepIndex === 0}
        isLast={currentStep === "confirm"}
        // Chưa chọn vé thì chưa có báo giá, mà không có báo giá thì không được
        // đi tiếp: mọi bước sau đều hiển thị tiền do BE chốt.
        canGoNext={currentStep === "type" ? ticketTypeId > 0 : Boolean(quote)}
        busy={quoting || purchase.isPending}
        onBack={() => setStepIndex((i) => Math.max(0, i - 1))}
        onNext={() => setStepIndex((i) => Math.min(steps.length - 1, i + 1))}
        onSubmit={handlePurchase}
      />
    </Dialog>
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
