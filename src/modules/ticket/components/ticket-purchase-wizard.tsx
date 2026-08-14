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

export function PromoStep({
  voucherInput,
  onVoucherInput,
  onApplyVoucher,
  quote,
  useLoyaltyPoints,
  onUseLoyaltyPoints,
}: {
  voucherInput: string;
  onVoucherInput: (v: string) => void;
  onApplyVoucher: () => void;
  quote?: TicketQuote;
  useLoyaltyPoints: boolean;
  onUseLoyaltyPoints: (next: boolean) => void;
}) {
  const t = useTranslations();
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

      {quote && quote.loyaltyPointsAvailable > 0 ? (
        <label className="flex items-center justify-between gap-4">
          <span>
            <span className="block font-semibold">{t("ticket.checkout.useLoyalty")}</span>
            <span className="block text-sm text-muted-foreground">
              {t("ticket.checkout.useLoyaltyHint", { points: quote.loyaltyPointsAvailable })}
            </span>
          </span>
          <Switch checked={useLoyaltyPoints} onCheckedChange={onUseLoyaltyPoints} />
        </label>
      ) : null}
    </div>
  );
}

export function ConfirmStep({ quote }: { quote?: TicketQuote }) {
  const t = useTranslations();
  if (!quote) {
    return <p className="text-sm text-muted-foreground">{t("ticket.checkout.pickTicket")}</p>;
  }
  return (
    <dl className="space-y-2 rounded-xl border p-4 text-sm">
      <SummaryRow label={quote.ticketTypeName} value={formatCurrency(quote.totalAmount)} />
      {/* Dòng dịch vụ lấy nguyên từ quote — không tra lại giá ở FE. */}
      {quote.services?.map((line) => (
        <SummaryRow
          key={line.id}
          label={`· ${line.name}`}
          value={formatCurrency(line.price)}
          muted
        />
      ))}
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
