"use client";

// Popup mua vé từng bước (V82). Thay form một trang trước đây: khách đi lần lượt
// loại vé -> huấn luyện viên -> dịch vụ kèm -> ưu đãi -> xác nhận.
//
// Nguyên tắc bất di bất dịch: MỌI con số tiền hiển thị đều lấy từ /tickets/quote
// của BE. FE không tự cộng giá dịch vụ vào tổng — payableAmount do BE chốt chính
// là số in lên VietQR, lệch một đồng là webhook Casso luôn thấy "trả thiếu" và
// vé không bao giờ được kích hoạt.

import { useMemo } from "react";
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles, Ticket as TicketIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import type { LoyaltyBalance } from "@/services/loyalty.service";
import type { GymServiceItem, TicketQuote, TicketType } from "@/types/Ticket";
import { formatCurrency } from "@/utils/format.util";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Switch } from "@/shared/components/ui/switch";
import { cn } from "@/shared/utils/cn.util";

export type WizardStep = "type" | "pt" | "services" | "promo" | "confirm";

/** Bước nào hiện ra phụ thuộc dữ liệu: không có PT hay dịch vụ thì bỏ hẳn bước. */
export function useWizardSteps(selectedType: TicketType | undefined, services: GymServiceItem[]) {
  return useMemo<WizardStep[]>(() => {
    const steps: WizardStep[] = ["type"];
    if (selectedType?.ptSurchargePerDay) steps.push("pt");
    if (services.length > 0) steps.push("services");
    steps.push("promo", "confirm");
    return steps;
  }, [selectedType?.ptSurchargePerDay, services.length]);
}

export function StepIndicator({
  steps,
  current,
}: {
  steps: WizardStep[];
  current: WizardStep;
}) {
  const t = useTranslations();
  const index = steps.indexOf(current);
  return (
    <ol className="mb-5 flex items-center gap-1.5">
      {steps.map((step, i) => {
        const done = i < index;
        const active = i === index;
        return (
          <li key={step} className="flex flex-1 items-center gap-1.5">
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
                done && "bg-primary text-primary-foreground",
                active && "bg-primary/15 text-primary ring-2 ring-primary",
                !done && !active && "bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-[11px] font-semibold sm:block",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {t(`ticket.wizard.step.${step}`)}
            </span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-border" />}
          </li>
        );
      })}
    </ol>
  );
}

export function TypeStep({
  types,
  value,
  onChange,
}: {
  types: TicketType[];
  value: number;
  onChange: (type: TicketType) => void;
}) {
  const t = useTranslations();
  return (
    <div className="grid max-h-[45vh] gap-2.5 overflow-y-auto pr-1">
      {types.map((type) => {
        const selected = type.id === value;
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "rounded-xl border p-4 text-left transition",
              selected ? "border-primary bg-primary/5" : "hover:border-primary/50",
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{type.name}</p>
                <p className="text-sm text-muted-foreground">
                  {type.kind === "DAY"
                    ? t("ticket.checkout.dayTicket")
                    : t("ticket.checkout.packageTicket", { days: type.dayCount })}
                </p>
                {/* Thời lượng buổi quyết định khách đặt được ca nào — phải thấy
                    lúc CHỌN vé, không phải lúc xếp lịch mới biết. */}
                {type.minutesPerDay ? (
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {t("ticket.checkout.minutesPerSession", { minutes: type.minutesPerDay })}
                  </p>
                ) : null}
                {type.description ? (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {type.description}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold tabular-nums">{formatCurrency(type.price)}</p>
                {type.ptSurchargePerDay ? (
                  <p className="text-xs text-muted-foreground">
                    {t("ticket.checkout.withPtPrice", {
                      price: formatCurrency(type.priceWithPt),
                    })}
                  </p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function PtStep({
  selectedType,
  withPt,
  onChange,
}: {
  selectedType: TicketType;
  withPt: boolean;
  onChange: (next: boolean) => void;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <label className="flex items-center justify-between gap-4">
        <span>
          <span className="block font-semibold">{t("ticket.checkout.withPt")}</span>
          <span className="block text-sm text-muted-foreground">
            {t("ticket.checkout.withPtHint", {
              surcharge: formatCurrency(selectedType.ptSurchargePerDay ?? 0),
              days: selectedType.dayCount,
            })}
          </span>
        </span>
        <Switch checked={withPt} onCheckedChange={onChange} />
      </label>
    </div>
  );
}

export function ServicesStep({
  services,
  selected,
  onToggle,
}: {
  services: GymServiceItem[];
  selected: number[];
  onToggle: (id: number) => void;
}) {
  const t = useTranslations();
  return (
    <div className="space-y-2.5">
      <p className="text-sm text-muted-foreground">{t("ticket.wizard.servicesHint")}</p>
      <div className="grid max-h-[45vh] gap-2.5 overflow-y-auto pr-1">
        {services.map((service) => {
          const checked = selected.includes(service.id);
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition",
                checked ? "border-primary bg-primary/5" : "hover:border-primary/50",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded border transition-colors",
                  checked ? "border-primary bg-primary text-primary-foreground" : "border-input",
                )}
              >
                {checked ? <Check className="size-3.5" /> : null}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="size-3.5 text-primary" />
                  {service.name}
                </span>
                {service.description ? (
                  <span className="mt-0.5 block line-clamp-2 text-sm text-muted-foreground">
                    {service.description}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 font-bold tabular-nums">
                {formatCurrency(service.price)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Số điểm vé này sẽ tích sau khi thanh toán — CÙNG công thức của BE
 * (`LoyaltyServiceImpl.earnFromTicket`: payableAmount / vndPerPoint, làm tròn
 * xuống). Đây là con số tham khảo để khách thấy lợi ích, không phải tiền phải
 * trả, nên tính ở FE được; mọi con số TIỀN vẫn lấy nguyên từ quote.
 */
function pointsEarnedFrom(quote: TicketQuote | undefined, vndPerPoint: number) {
  if (!quote || !vndPerPoint) return 0;
  return Math.floor(quote.payableAmount / vndPerPoint);
}

export function PromoStep({
  voucherInput,
  onVoucherInput,
  onApplyVoucher,
  quote,
  useLoyaltyPoints,
  onUseLoyaltyPoints,
  loyalty,
}: {
  voucherInput: string;
  onVoucherInput: (v: string) => void;
  onApplyVoucher: () => void;
  quote?: TicketQuote;
  useLoyaltyPoints: boolean;
  onUseLoyaltyPoints: (next: boolean) => void;
  /** Chỉ dùng để biết tỷ lệ quy đổi; SỐ DƯ lấy từ quote (BE trả kèm báo giá). */
  loyalty?: LoyaltyBalance;
}) {
  const t = useTranslations();

  const balance = quote?.loyaltyPointsAvailable ?? loyalty?.pointsBalance ?? 0;
  const pointValue = loyalty?.pointValue ?? 0;
  const vndPerPoint = loyalty?.vndPerPoint ?? 0;
  const pointsUsed = quote?.loyaltyPointsUsed ?? 0;
  const earning = pointsEarnedFrom(quote, vndPerPoint);

  return (
    <div className="space-y-4 rounded-xl border p-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold">{t("ticket.checkout.voucher")}</label>
        <div className="flex gap-2">
          <Input
            value={voucherInput}
            onChange={(event) => onVoucherInput(event.target.value)}
            placeholder={t("ticket.checkout.voucherPlaceholder")}
          />
          <Button type="button" variant="outline" onClick={onApplyVoucher}>
            {t("ticket.checkout.applyVoucher")}
          </Button>
        </div>
        {/* Mã sai KHÔNG chặn xem giá — chỉ giải thích ngay dưới ô nhập. */}
        {quote?.voucherMessage ? (
          <p className="text-sm text-warning">{quote.voucherMessage}</p>
        ) : null}
      </div>

      {/* Khối điểm thưởng hiện KỂ CẢ khi số dư bằng 0: trước đây nó ẩn hẳn nên
          khách không biết mua vé có tích điểm, và không hiểu vì sao chỗ khác nói
          "dùng điểm khi mua vé" mà popup lại chẳng có gì. */}
      <div className="space-y-2.5 border-t pt-4">
        <label className="flex items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="flex items-center gap-1.5 font-semibold">
              <Sparkles className="size-3.5 text-primary" />
              {t("ticket.checkout.loyaltyTitle")}
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {balance > 0
                ? t("ticket.checkout.loyaltyBalance", {
                    points: balance,
                    amount: formatCurrency(balance * pointValue),
                  })
                : t("ticket.checkout.loyaltyNone")}
            </span>
          </span>
          <Switch
            checked={useLoyaltyPoints}
            onCheckedChange={onUseLoyaltyPoints}
            disabled={balance === 0}
            aria-label={t("ticket.checkout.useLoyalty")}
          />
        </label>

        {useLoyaltyPoints && quote && pointsUsed > 0 ? (
          <p className="rounded-lg bg-primary/5 px-3 py-2 text-sm font-semibold text-primary">
            {t("ticket.checkout.loyaltyApplied", {
              points: pointsUsed,
              amount: formatCurrency(quote.loyaltyDiscount),
              remaining: balance - pointsUsed,
            })}
          </p>
        ) : null}

        {vndPerPoint > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("ticket.checkout.loyaltyEarnRate", {
              vndPerPoint: formatCurrency(vndPerPoint),
              pointValue: formatCurrency(pointValue),
            })}
            {earning > 0
              ? ` ${t("ticket.checkout.loyaltyEarnPreview", { points: earning })}`
              : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function ConfirmStep({
  quote,
  loyalty,
}: {
  quote?: TicketQuote;
  loyalty?: LoyaltyBalance;
}) {
  const t = useTranslations();
  const earning = pointsEarnedFrom(quote, loyalty?.vndPerPoint ?? 0);
  if (!quote) {
    return <p className="text-sm text-muted-foreground">{t("ticket.checkout.pickTicket")}</p>;
  }
  /*
   * `totalAmount` của BE là TỔNG: giá vé + phụ phí PT × số ngày + tiền dịch vụ.
   * Trước đây dòng đầu in thẳng totalAmount dưới nhãn tên vé rồi liệt kê dịch vụ
   * ngay bên dưới, nên bảng đọc ra thành "vé 11.000 + xông hơi 5.000" mà "Phải
   * trả" vẫn 11.000 — trông đúng như cộng thiếu, dù số tiền thu vào là đúng.
   *
   * Ba khoản giờ do BE tách sẵn (TicketPriceCalculator.TicketPricing), FE chỉ in
   * ra: không client nào chia lại tiền thì không có đường nào lệch với số server
   * thu. Nhánh `??` chỉ để FE mới đứng trước BE cũ chưa có hai trường này —
   * lúc đó gộp phụ phí PT vào dòng vé như trước, bảng vẫn cộng khớp.
   */
  const servicesAmount = quote.servicesAmount ?? 0;
  const ptSurcharge = quote.ptSurchargeAmount ?? 0;
  const ticketAmount = quote.baseAmount ?? (quote.totalAmount - servicesAmount - ptSurcharge);
  const discounted = quote.voucherDiscount > 0 || quote.loyaltyDiscount > 0;
  return (
    <dl className="space-y-2 rounded-xl border p-4 text-sm">
      <SummaryRow label={quote.ticketTypeName} value={formatCurrency(ticketAmount)} />
      {quote.minutesPerDay ? (
        <SummaryRow
          label={t("ticket.checkout.sessionLength")}
          value={t("ticket.checkout.minutesValue", { minutes: quote.minutesPerDay })}
          muted
        />
      ) : null}
      {/* Phụ phí PT tính theo NGÀY (câu 6) nên vé gói đội lên nhiều so với giá
          niêm yết — ghi rõ nhân bao nhiêu ngày thay vì để khách tự đoán. */}
      {ptSurcharge > 0 ? (
        <SummaryRow
          label={t("ticket.checkout.ptSurcharge", { days: quote.dayCount })}
          value={`+ ${formatCurrency(ptSurcharge)}`}
        />
      ) : null}
      {/* Dòng dịch vụ lấy nguyên từ quote — không tra lại giá ở FE. */}
      {quote.services?.map((line) => (
        <SummaryRow
          key={line.id}
          label={`· ${line.name}`}
          value={formatCurrency(line.price)}
          muted
        />
      ))}
      {/* Có giảm giá thì mốc "tạm tính" cho thấy voucher/điểm trừ trên số nào;
          không có giảm giá thì nó trùng hệt "Phải trả" nên bỏ đi cho gọn. */}
      {discounted && (servicesAmount > 0 || ptSurcharge > 0) ? (
        <SummaryRow
          label={t("ticket.checkout.subtotal")}
          value={formatCurrency(quote.totalAmount)}
        />
      ) : null}
      {quote.voucherDiscount > 0 ? (
        <SummaryRow
          label={t("ticket.checkout.voucherDiscount")}
          value={`- ${formatCurrency(quote.voucherDiscount)}`}
        />
      ) : null}
      {quote.loyaltyDiscount > 0 ? (
        <SummaryRow
          label={t("ticket.checkout.loyaltyDiscount", { points: quote.loyaltyPointsUsed })}
          value={`- ${formatCurrency(quote.loyaltyDiscount)}`}
        />
      ) : null}
      <div className="border-t pt-2">
        <SummaryRow
          label={t("ticket.checkout.payable")}
          value={formatCurrency(quote.payableAmount)}
          emphasis
        />
      </div>
      {/* Điểm TÍCH ĐƯỢC nằm dưới dòng "Phải trả" vì nó tính trên số thực trả,
          không phải giá vé — và là con số ước lượng, ghi nhận khi thanh toán xong. */}
      {earning > 0 ? (
        <SummaryRow
          label={t("ticket.checkout.loyaltyEarn")}
          value={`+${earning} ${t("member.loyalty.points")}`}
          muted
        />
      ) : null}
      {quote.payableAmount === 0 ? (
        <p className="text-sm text-success">{t("ticket.checkout.fullyCovered")}</p>
      ) : null}
    </dl>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={cn("text-muted-foreground", emphasis && "font-semibold text-foreground")}>
        {label}
      </dt>
      <dd
        className={cn(
          "tabular-nums",
          emphasis ? "text-base font-bold" : muted ? "text-muted-foreground" : "font-semibold",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

export function WizardFooter({
  isFirst,
  isLast,
  canGoNext,
  busy,
  onBack,
  onNext,
  onSubmit,
}: {
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  busy: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="mt-5 flex items-center justify-between gap-2 border-t pt-4">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={isFirst || busy}
        className="gap-1"
      >
        <ChevronLeft className="size-4" />
        {t("common.actions.previous")}
      </Button>
      {isLast ? (
        <Button onClick={onSubmit} disabled={!canGoNext || busy} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <TicketIcon className="size-4" />}
          {t("ticket.checkout.buy")}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canGoNext || busy} className="gap-1">
          {t("common.actions.next")}
          <ChevronRight className="size-4" />
        </Button>
      )}
    </div>
  );
}
