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
import { useQuery } from "@tanstack/react-query";
import { marketplaceService } from "@/services/marketplace.service";
import {
  useBranchServices,
  useBranchTicketTypes,
  usePtSlotGrid,
  usePurchaseTicket,
  useTicketPayment,
  useTicketQuote,
} from "../hooks/use-ticket";
import { addDays, todayIso } from "../calendar-date.util";
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
 * Cửa sổ kiểm tra khung giờ của PT trước khi bán vé có PT. 30 ngày: dài hơn thì
 * "có khung" không còn nghĩa gì với vé ngày, ngắn hơn thì vé gói dài bị báo động
 * oan vì gym mới xếp ca cho vài tuần tới.
 */
const PT_SLOT_LOOKAHEAD_DAYS = 30;

/**
 * Đường sang trang xếp lịch sau khi vé đã dùng được. `ptId` chỉ đi kèm khi khách
 * đến vì đúng PT đó VÀ vé thật sự có PT — trang xếp lịch dùng nó để lọc sẵn PT,
 * gắn bừa vào vé không PT thì trang kia lọc theo một người không liên quan.
 */
function scheduleHref(ticketId: number, ptId: number) {
  const pt = ptId > 0 ? `&ptId=${ptId}` : "";
  return `/schedule?ticketId=${ticketId}&mode=book${pt}`;
}

/**
 * Mua vé — popup từng bước (V82): loại vé -> huấn luyện viên -> dịch vụ kèm ->
 * ưu đãi -> xác nhận. Bước PT và bước dịch vụ tự ẩn khi chi nhánh không có.
 *
 * Mọi thay đổi (toggle PT, chọn dịch vụ, mã voucher, toggle điểm) đều gọi lại
 * /tickets/quote để con số hiển thị luôn là con số server sẽ thu. FE KHÔNG tự
 * tính giá — kể cả tiền dịch vụ.
 *
 * <p>Hai đường vào: {@code ?branchId=} khi khách đã chọn đúng chi nhánh (thẻ vé
 * ở trang gym, trang Gói tập), hoặc {@code ?gymId=} từ nút "Đặt lịch" của trang
 * gym và trang PT — lúc đó popup tự hỏi chi nhánh trước. Vé BẮT BUỘC gắn chi
 * nhánh nên không có đường nào bỏ qua bước này; gym chỉ có một chi nhánh thì
 * chọn hộ luôn.
 *
 * <p>{@code ?withPt=1} bật sẵn lựa chọn tập cùng PT — đường vào từ trang PT đã
 * nói lên ý định đó rồi. Khách vẫn tắt lại được ở bước "Huấn luyện viên".
 */
export function TicketCheckoutPage() {
  const t = useTranslations("ticket.checkout");
  const router = useRouter();
  const params = useSearchParams();
  const { toast } = useToast();

  const preselectedBranchId = Number(params.get("branchId") ?? 0);
  const gymId = Number(params.get("gymId") ?? 0);
  const preselectedTypeId = Number(params.get("ticketTypeId") ?? 0);
  // `?ticketId=` = mở lại đơn của một vé CHỜ THANH TOÁN ("Thanh toán" ở Vé của
  // tôi). Trước đây tham số này bị bỏ qua nên link đó rơi vào trạng thái rỗng
  // "Chưa chọn chi nhánh" và không có cách nào trả tiếp cho vé đã mua.
  const pendingTicketId = Number(params.get("ticketId") ?? 0);
  // Vào từ nút "Đặt lịch với PT này" ở trang PT: ý định tập cùng PT đã rõ, bật
  // sẵn để khách không phải tự tìm công tắc. Vé chọn ra không có phụ phí PT thì
  // selectType() tắt lại — cờ này chỉ là giá trị khởi tạo.
  const wantsPt = params.get("withPt") === "1";
  /*
   * `?ptId=` — khách đến từ trang của MỘT PT cụ thể. Vé vẫn là vé của chi nhánh
   * (mô hình vé không ghim PT vào vé), nhưng biết PT nào thì làm được hai việc
   * mà trước đây khách phải tự mò: chỉ hỏi những chi nhánh PT đó dạy, và cảnh
   * báo TRƯỚC KHI TRẢ TIỀN nếu PT đó chưa có khung giờ nào. Sau khi mua thì
   * chuyển tiếp sang trang xếp lịch để lọc sẵn đúng PT.
   */
  const intendedPtId = Number(params.get("ptId") ?? 0);

  const [pickedBranchId, setPickedBranchId] = useState(preselectedBranchId);
  const [ticketTypeId, setTicketTypeId] = useState(preselectedTypeId);
  const [withPt, setWithPt] = useState(wantsPt);
  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState("");
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);
  const [purchasedTicketId, setPurchasedTicketId] = useState<number | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  /*
   * Chi nhánh của gym — chỉ tải khi vào bằng ?gymId=. Dùng endpoint công khai
   * sẵn có thay vì thêm API mới; danh sách này cũng chính là thứ trang gym đang
   * hiển thị nên khách nhìn thấy đúng những cái tên vừa đọc.
   */
  const { data: gymBranches, isLoading: branchesLoading } = useQuery({
    queryKey: ["gym-branches", gymId],
    queryFn: () => marketplaceService.getGymBranches(gymId),
    enabled: gymId > 0 && !preselectedBranchId,
  });
  /*
   * Đến từ trang một PT: hồ sơ PT nói PT đó phụ trách chi nhánh nào. Cùng một
   * query key với trang PT nên thường có sẵn trong cache, không tốn thêm vòng.
   */
  const { data: intendedPt, isLoading: intendedPtLoading } = useQuery({
    queryKey: ["marketplace", "pt", intendedPtId],
    queryFn: () => marketplaceService.getPt(intendedPtId),
    enabled: intendedPtId > 0,
  });
  /*
   * Chỉ hỏi những chi nhánh PT đó thật sự dạy — chi nhánh khác của gym là lựa
   * chọn sai 100%: mua xong sẽ không thấy PT này trong lưới xếp lịch. `branches`
   * chưa có (BE cũ) thì giữ nguyên danh sách đầy đủ như trước.
   */
  const ptBranchIds = intendedPt?.branches?.map((branch) => branch.id) ?? null;
  const branchChoices = ptBranchIds?.length
    ? (gymBranches ?? []).filter((branch) => ptBranchIds.includes(branch.id))
    : (gymBranches ?? []);
  // Gym một chi nhánh thì không bắt khách chọn một danh sách chỉ có một dòng.
  const onlyBranchId = branchChoices.length === 1 ? branchChoices[0].id ?? 0 : 0;
  const branchId = pickedBranchId || onlyBranchId;

  const { data: types, isLoading: typesLoading } = useBranchTicketTypes(branchId);
  const { data: branchServices = [] } = useBranchServices(branchId);
  // Tỷ lệ quy đổi điểm (bao nhiêu đồng = 1 điểm, 1 điểm giảm bao nhiêu) để bước
  // "Ưu đãi" nói được giá trị của số dư. Trang này đã bị AuthGuard giới hạn
  // ROLE_CUSTOMER nên gọi /loyalty luôn hợp lệ.
  const { data: loyalty } = useLoyaltyBalance();

  const selectedType = types?.find((type) => type.id === ticketTypeId);
  /*
   * Vé không có phụ phí PT thì "tập cùng PT" không tồn tại: bước đó bị ẩn khỏi
   * wizard nên khách không thể tắt, mà BE lại lưu withPt=true với phụ phí null —
   * vé ghi "có PT" nhưng gym không thu đồng nào. selectType() đã tắt hộ khi khách
   * tự chọn vé; chốt thêm ở đây vì ?withPt=1 có thể đi kèm ?ticketTypeId= sẵn.
   */
  const withPtEffective = withPt && Boolean(selectedType?.ptSurchargePerDay);

  /*
   * Đến vì MỘT PT cụ thể và đang định trả phụ phí PT: hỏi lưới khung giờ của
   * đúng PT đó trước khi khách bấm mua. Phụ phí PT nhân theo từng ngày của vé,
   * nên "mua rồi mới biết PT chưa có ca nào" là mất tiền thật — chính kịch bản
   * BUG-02 trong báo cáo test 20/08 (lưới rỗng ở mọi chi nhánh vì gym chưa khai
   * ca). Chỉ hỏi khi đã chọn loại vé có phụ phí PT, nên không tốn vòng gọi nào
   * ở bước đầu.
   */
  const slotFrom = todayIso();
  const ptSlots = usePtSlotGrid(
    branchId,
    slotFrom,
    addDays(slotFrom, PT_SLOT_LOOKAHEAD_DAYS),
    intendedPtId,
    intendedPtId > 0 && branchId > 0 && withPtEffective,
    // Hỏi đúng thời lượng loại vé đang chọn: buổi là một chuỗi slot liền nhau,
    // nên "PT còn slot trống" và "PT ghép đủ 120 phút liền mạch" là hai câu khác
    // nhau. Hỏi câu rộng hơn thì cảnh báo im lặng ở đúng ca cần cảnh báo nhất.
    selectedType?.minutesPerDay ?? undefined,
  );
  /*
   * CHỈ kết luận khi truy vấn thành công: lỗi mạng hay 409 (PT không thuộc chi
   * nhánh, do URL gõ tay) mà cũng báo "chưa có khung giờ" thì lời cảnh báo sai
   * còn tệ hơn không có.
   */
  const intendedPtHasNoSlot =
    ptSlots.isSuccess && !(ptSlots.data ?? []).some((cell) => !cell.taken);

  const quotePayload = useMemo<TicketQuoteRequest | null>(
    () =>
      branchId && ticketTypeId
        ? {
            branchId,
            ticketTypeId,
            withPt: withPtEffective,
            voucherCode: appliedVoucher || undefined,
            useLoyaltyPoints,
            serviceIds: serviceIds.length ? serviceIds : undefined,
          }
        : null,
    [branchId, ticketTypeId, withPtEffective, appliedVoucher, useLoyaltyPoints, serviceIds],
  );

  const { data: quote, isFetching: quoting } = useTicketQuote(quotePayload);
  const purchase = usePurchaseTicket();

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
        <TicketPaymentPanel
          ticketId={payingTicketId}
          ptId={withPtEffective ? intendedPtId : 0}
        />
      </Dialog>
    );
  }

  if (!branchId) {
    // Vào bằng ?gymId= thì thiếu chi nhánh là chuyện BÌNH THƯỜNG của bước đầu,
    // không phải lỗi — hỏi luôn ở đây thay vì đá khách về trang gym tự tìm.
    if (gymId > 0) {
      return (
        <Dialog open title={t("title")} onClose={() => router.back()}>
          {/* Chờ cả hồ sơ PT: hiện tạm danh sách đầy đủ rồi mới co lại là đủ để
              khách bấm nhầm một chi nhánh PT đó không dạy. */}
          {branchesLoading || intendedPtLoading ? (
            <LoadingSkeleton />
          ) : !branchChoices.length ? (
            <EmptyState title={t("noBranch")} description={t("noBranchHint")} />
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {ptBranchIds?.length
                  ? t("pickBranchOfPtHint", { name: intendedPt?.displayName ?? "" })
                  : t("pickBranchHint")}
              </p>
              <ul className="space-y-2">
                {branchChoices.map((branch) => (
                  <li key={branch.id}>
                    <button
                      type="button"
                      onClick={() => setPickedBranchId(branch.id ?? 0)}
                      className="w-full rounded-xl border border-border p-3 text-left transition hover:border-primary/60 hover:bg-muted/40"
                    >
                      <span className="block text-sm font-semibold">{branch.name}</span>
                      {branch.address ? (
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {branch.address}
                        </span>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Dialog>
      );
    }
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
        router.push(scheduleHref(result.ticket.id, withPtEffective ? intendedPtId : 0));
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

      {/*
        Hiện ở MỌI bước, không chỉ bước chọn PT: đây là lý do để khách dừng lại
        trước khi trả phụ phí PT, mà bước xác nhận mới là chỗ họ bấm trả tiền.
        Chỉ nổi lên đúng tình huống xấu (đến vì một PT mà PT đó chưa có khung giờ
        nào), nên không phải là một dòng nhiễu thường trực.
      */}
      {intendedPtHasNoSlot ? (
        <p className="mb-4 rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs font-semibold text-warning">
          {t("ptNoSlotWarning", {
            name: intendedPt?.displayName ?? "",
            days: PT_SLOT_LOOKAHEAD_DAYS,
          })}
        </p>
      ) : null}

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
function TicketPaymentPanel({ ticketId, ptId = 0 }: { ticketId: number; ptId?: number }) {
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
          onClick={() => router.push(scheduleHref(ticketId, ptId))}
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
