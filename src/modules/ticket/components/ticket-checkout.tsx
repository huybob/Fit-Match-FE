"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, QrCode } from "lucide-react";
import { formatCurrency } from "@/utils/format.util";
import { useFormatters } from "@/i18n/use-formatters";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { useLoyaltyBalance } from "@/modules/loyalty/hooks/use-loyalty";
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
  // `?ticketId=` = mở lại đơn của một vé CHỜ THANH TOÁN ("Thanh toán" ở Vé của
  // tôi). Trước đây tham số này bị bỏ qua nên link đó rơi vào trạng thái rỗng
  // "Chưa chọn chi nhánh" và không có cách nào trả tiếp cho vé đã mua.
  const pendingTicketId = Number(params.get("ticketId") ?? 0);

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
  // Tỷ lệ quy đổi điểm (bao nhiêu đồng = 1 điểm, 1 điểm giảm bao nhiêu) để bước
  // "Ưu đãi" nói được giá trị của số dư. Trang này đã bị AuthGuard giới hạn
  // ROLE_CUSTOMER nên gọi /loyalty luôn hợp lệ.
  const { data: loyalty } = useLoyaltyBalance();

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

  /** Vé cần chuyển khoản: vừa mua xong, hoặc mở lại từ "Vé của tôi". */
  const payingTicketId = purchasedTicketId ?? (pendingTicketId > 0 ? pendingTicketId : null);

  // QR nằm TRONG chính popup mua vé, không phải một màn hình riêng: mua và trả
  // tiền là một việc liền mạch, nhảy sang trang khác làm khách tưởng đã xong.
  // Đóng popup ở bước này thì về "Vé của tôi" — chỗ duy nhất trả tiếp được.
  if (payingTicketId) {
    return (
      <Dialog open title={t("scanToPay")} onClose={() => router.push("/profile/tickets")}>
        <TicketPaymentPanel ticketId={payingTicketId} />
      </Dialog>
    );
  }

  if (!branchId) {
    return (
      <Dialog open title={t("title")} onClose={() => router.back()}>
        <EmptyState title={t("noBranch")} description={t("noBranchHint")} />
      </Dialog>
    );
  }
  if (typesLoading) {
    return (
      <Dialog open title={t("title")} onClose={() => router.back()}>
        <LoadingSkeleton />
      </Dialog>
    );
  }
  if (!types?.length) {
    return (
      <Dialog open title={t("title")} onClose={() => router.back()}>
        <EmptyState title={t("noTickets")} description={t("noTicketsHint")} />
      </Dialog>
    );
  }

  async function handlePurchase() {
    if (!quotePayload) return;
    try {
      const result = await purchase.mutateAsync(quotePayload);
      // Câu 14: điểm/voucher phủ hết -> vé ACTIVE ngay, bỏ qua bước QR.
      if (!result.paymentOrder) {
        toast({ type: "success", title: t("activatedImmediately") });
        // mode=book: vé vừa kích hoạt thì việc tiếp theo là chọn ngày, mở thẳng
        // chế độ đặt lịch thay vì để khách bấm thêm một nút nữa.
        router.push(`/schedule?ticketId=${result.ticket.id}&mode=book`);
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
          loyalty={loyalty}
        />
      )}

      {currentStep === "confirm" && <ConfirmStep quote={quote} loyalty={loyalty} />}

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

/**
 * Đơn không còn trả được nữa — hiện QR cũ lúc này chỉ dẫn khách chuyển tiền vào
 * hư không. Map sang key i18n cố định (không ghép chuỗi động) để TypeScript kiểm
 * được key có thật, và để "PENDING"/"PAID" không lọt vào nhánh này.
 */
const DEAD_ORDER_LABEL = {
  EXPIRED: "orderStatus.EXPIRED",
  CANCELLED: "orderStatus.CANCELLED",
  FAILED: "orderStatus.FAILED",
} as const;

/**
 * Bước QR bên trong popup mua vé — poll 5s tới khi webhook Casso xác nhận
 * (`useTicketPayment` tự dừng poll khi khác PENDING), rồi mở luôn lối sang đặt lịch.
 */
function TicketPaymentPanel({ ticketId }: { ticketId: number }) {
  const t = useTranslations("ticket.checkout");
  const router = useRouter();
  const fmt = useFormatters();
  const { data: order, isLoading } = useTicketPayment(ticketId);

  if (isLoading) return <LoadingSkeleton />;
  if (!order) return <EmptyState title={t("noPaymentOrder")} description={t("pollingHint")} />;

  if (order.status === "PAID") {
    return (
      <div className="space-y-4 text-center">
        <Badge className="gap-1">
          <CheckCircle2 className="size-3.5" />
          {t("paid")}
        </Badge>
        <p>{t("paidHint")}</p>
        <Button
          className="w-full"
          onClick={() => router.push(`/schedule?ticketId=${ticketId}&mode=book`)}
        >
          {t("goSchedule")}
        </Button>
      </div>
    );
  }

  const deadLabel =
    order.status in DEAD_ORDER_LABEL
      ? DEAD_ORDER_LABEL[order.status as keyof typeof DEAD_ORDER_LABEL]
      : null;

  if (deadLabel) {
    return (
      <div className="space-y-4 text-center">
        <Badge variant="outline">{t(deadLabel)}</Badge>
        <p className="text-sm text-muted-foreground">{t("orderInactiveHint")}</p>
        <Button variant="outline" className="w-full" onClick={() => router.push("/profile/tickets")}>
          {t("openMyTickets")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-center">
      <p className="text-2xl font-bold">{formatCurrency(order.amount)}</p>

      {order.qrContent ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={order.qrContent}
          alt={t("qrAlt")}
          // Nền trắng cố định, KHÔNG dùng token: mã QR nào cũng là vạch đen trên
          // nền trong suốt, đặt lên mặt tối của dark mode là máy quét đọc ngược.
          className="mx-auto w-56 rounded-xl bg-white p-2"
        />
      ) : (
        <QrCode className="mx-auto size-24 text-muted-foreground" />
      )}

      <div className="rounded-xl bg-muted/40 p-3 text-sm">
        <p className="text-muted-foreground">
          {t("refCode")}: <span className="font-mono font-semibold text-foreground">{order.refCode}</span>
        </p>
        {order.expiresAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("payExpiresAt", { time: fmt.dateTime(order.expiresAt) })}
          </p>
        ) : null}
      </div>

      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        {t("pollingHint")}
      </p>
    </div>
  );
}
