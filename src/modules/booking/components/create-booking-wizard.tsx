"use client";

import { formatCurrency } from "@/utils/format.util";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  StickyNote,
  Ticket,
  UserRound,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { Booking, bookingService, CustomerPackage } from "@/services/booking.service";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  DialogContent,
  DialogDescription,
  DialogRoot,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { TimePicker } from "@/shared/components/ui/time-picker";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  marketplaceService,
  type PublicBranch,
  type PublicGymService,
  type PublicTrainingPackage,
  type PtPublicProfile,
} from "@/services/marketplace.service";
import { voucherService } from "@/services/voucher.service";
import { loyaltyService } from "@/services/loyalty.service";
import { useBookingAction, useCreateBooking, useMyPackages } from "../hooks/use-booking";
import { useBookingSchemas } from "../use-booking-schemas";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

const money = (v?: number) => formatCurrency(v ?? 0);

/** Các bước của luồng đặt lịch — `catalog` bị bỏ qua khi dùng gói đã mua. */
type StepId = "mode" | "catalog" | "place" | "time" | "extras" | "review";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const QUICK_DURATIONS = [45, 60, 90, 120];

function addMinutes(time: string, minutes: number) {
  if (!TIME_RE.test(time)) return time;
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(h * 60 + m + minutes, 23 * 60 + 55);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function isoDate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

/**
 * UC-031/032/035 — luồng đặt lịch dạng wizard.
 *
 * Trước đây toàn bộ 10+ trường nằm trong một form dài; khách phải tự hiểu trường
 * nào phụ thuộc trường nào (chọn gym mới có dịch vụ, chọn gói thì không cần gym).
 * Chia thành các bước có thứ tự + tóm tắt trước khi gửi; payload gửi BE không đổi.
 */
export function CreateBookingDialog({ open, onClose, onCheckedOut, initialGymId, initialPackageId }: {
  open: boolean;
  onClose: () => void;
  onCheckedOut: (bookingId: number, payable: number) => void;
  /** Bug 10: gym/gói chọn sẵn khi mở từ deep-link trang gym / gói tập. */
  initialGymId?: number;
  initialPackageId?: number;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const create = useCreateBooking();
  const checkoutAction = useBookingAction("customer");

  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [gymKeyword, setGymKeyword] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [pointsToUse, setPointsToUse] = useState("");
  // C-2 (UC-044): đề nghị vào danh sách chờ khi slot đã kín (409).
  const [waitlistOffer, setWaitlistOffer] = useState<{
    serviceId?: number; packageId?: number; preferredStart: string;
  } | null>(null);

  const joinWaitlist = useMutation({
    mutationFn: () => bookingService.joinWaitlist(waitlistOffer!),
    onSuccess: () => {
      toast({ type: "success", title: t("booking.joinedWaitlist"), description: t("booking.joinedWaitlistDesc") });
      setWaitlistOffer(null);
    },
    onError: (e) => toast({ type: "error", title: t("booking.joinWaitlistFailed"), description: toErrorMessage(e) }),
  });
  const loyalty = useQuery({ queryKey: ["loyalty", "balance-mini"], queryFn: () => loyaltyService.balance(), enabled: open });

  const schemas = useBookingSchemas();
  const form = useForm<z.infer<typeof schemas.createBooking>>({
    resolver: zodResolver(schemas.createBooking),
    defaultValues: {
      mode: "new",
      gymId: 0,
      itemType: "service",
      itemId: 0,
      bookingDate: isoDate(),
      startTime: "08:00",
      endTime: "09:00",
      note: "",
    },
  });
  const values = form.watch();
  const { mode, itemType } = values;
  const gymId = values.gymId ?? 0;

  const myPackages = useMyPackages(open);
  const usablePackages = useMemo(
    () => (myPackages.data ?? []).filter((p) => p.status === "ACTIVE" && p.sessionsRemaining > 0),
    [myPackages.data],
  );
  const selectedPackage = usablePackages.find((p) => p.id === values.customerPackageId);
  // Ở chế độ dùng gói, gym được suy ra từ gói đã chọn.
  const effectiveGymId = mode === "package" ? (selectedPackage?.gymId ?? 0) : gymId;

  const gyms = useQuery({
    queryKey: ["marketplace", "gyms", "booking"],
    queryFn: () => marketplaceService.searchGyms({ size: 100 }),
    enabled: open && mode === "new",
  });
  const services = useQuery({
    queryKey: ["marketplace", "gym", gymId, "services"],
    queryFn: () => marketplaceService.getGymServices(gymId),
    enabled: open && gymId > 0,
  });
  const packages = useQuery({
    queryKey: ["marketplace", "gym", gymId, "packages"],
    queryFn: () => marketplaceService.getGymPackages(gymId),
    enabled: open && gymId > 0,
  });
  const branches = useQuery({
    queryKey: ["marketplace", "gym", effectiveGymId, "branches"],
    queryFn: () => marketplaceService.getGymBranches(effectiveGymId),
    enabled: open && effectiveGymId > 0,
  });
  const pts = useQuery({
    queryKey: ["marketplace", "gym", effectiveGymId, "pts"],
    queryFn: () => marketplaceService.getGymPts(effectiveGymId),
    enabled: open && effectiveGymId > 0,
  });

  const catalogItems: Array<PublicGymService | PublicTrainingPackage> =
    itemType === "service" ? (services.data ?? []) : (packages.data ?? []);
  const selectedItem = catalogItems.find((i) => i.id === values.itemId);
  const selectedGym = gyms.data?.content?.find((g) => g.id === gymId);
  const selectedBranch = branches.data?.find((b) => b.id === values.branchId);
  const selectedPt = pts.data?.content?.find((p) => p.id === values.ptId);

  // B-31/C-15 (UC-030): pre-check slot ngay khi chọn giờ — khách biết trước khi gửi.
  const precheckEnabled =
    open
    && !!(values.ptId || values.branchId)
    && !!values.bookingDate
    && TIME_RE.test(values.startTime ?? "")
    && TIME_RE.test(values.endTime ?? "")
    && (values.startTime ?? "") < (values.endTime ?? "");
  const precheck = useQuery({
    queryKey: ["availability-check", values.ptId, values.branchId, values.bookingDate, values.startTime, values.endTime],
    queryFn: () =>
      bookingService.checkAvailability({
        ptId: values.ptId || undefined,
        branchId: values.branchId || undefined,
        startAt: `${values.bookingDate}T${values.startTime}:00`,
        endAt: `${values.bookingDate}T${values.endTime}:00`,
      }),
    enabled: precheckEnabled,
    staleTime: 15_000,
  });

  const steps: StepId[] = mode === "package"
    ? ["mode", "place", "time", "extras", "review"]
    : ["mode", "catalog", "place", "time", "extras", "review"];
  // Đổi hình thức làm số bước thay đổi — kẹp chỉ số để không lệch nhãn/tiến độ.
  const safeIndex = Math.min(stepIndex, steps.length - 1);
  const current = steps[safeIndex];
  const stepMeta: Record<StepId, { label: string; title: string; subtitle: string; icon: typeof MapPin }> = {
    mode: { label: t("booking.wizard.modeStep"), title: t("booking.wizard.modeTitle"), subtitle: t("booking.wizard.modeSubtitle"), icon: Sparkles },
    catalog: { label: t("booking.wizard.catalogStep"), title: t("booking.wizard.catalogTitle"), subtitle: t("booking.wizard.catalogSubtitle"), icon: Building2 },
    place: { label: t("booking.wizard.placeStep"), title: t("booking.wizard.placeTitle"), subtitle: t("booking.wizard.placeSubtitle"), icon: MapPin },
    time: { label: t("booking.wizard.timeStep"), title: t("booking.wizard.timeTitle"), subtitle: t("booking.wizard.timeSubtitle"), icon: CalendarDays },
    extras: { label: t("booking.wizard.extrasStep"), title: t("booking.wizard.extrasTitle"), subtitle: t("booking.wizard.extrasSubtitle"), icon: Ticket },
    review: { label: t("booking.wizard.reviewStep"), title: t("booking.wizard.reviewTitle"), subtitle: t("booking.wizard.reviewSubtitle"), icon: CalendarCheck2 },
  };

  // Bug 10: áp prefill từ deep-link mỗi khi dialog mở; gym/gói đã biết -> nhảy
  // thẳng tới bước chọn chi nhánh, khách vẫn quay lại sửa được.
  useEffect(() => {
    if (!open) return;
    setStepIndex(0);
    setFurthest(0);
    setStepError(null);
    if (initialGymId) form.setValue("gymId", initialGymId);
    if (initialPackageId) {
      form.setValue("itemType", "package");
      form.setValue("itemId", initialPackageId);
    }
    if (initialGymId && initialPackageId) {
      setStepIndex(2);
      setFurthest(2);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialGymId, initialPackageId]);

  function reset() {
    form.reset();
    setVoucherCode("");
    setPointsToUse("");
    setWaitlistOffer(null);
    setStepIndex(0);
    setFurthest(0);
    setStepError(null);
  }

  async function goNext() {
    setStepError(null);
    if (current === "mode" && mode === "package" && !values.customerPackageId) {
      setStepError(t("booking.wizard.requirePackage"));
      return;
    }
    if (current === "catalog") {
      if (!gymId) { setStepError(t("booking.wizard.requireGym")); return; }
      if (!values.itemId) { setStepError(t("booking.wizard.requireItem")); return; }
    }
    if (current === "time") {
      const ok = await form.trigger(["bookingDate", "startTime", "endTime"]);
      if (!ok) return;
    }
    const next = Math.min(safeIndex + 1, steps.length - 1);
    setStepIndex(next);
    setFurthest((f) => Math.max(f, next));
  }

  const submitting = create.isPending || checkoutAction.isPending;

  const onSubmit = form.handleSubmit(async (v) => {
    setWaitlistOffer(null);
    try {
      const booking = await create.mutateAsync({
        serviceId: v.mode === "new" && v.itemType === "service" ? v.itemId : undefined,
        packageId: v.mode === "new" && v.itemType === "package" ? v.itemId : undefined,
        customerPackageId: v.mode === "package" ? v.customerPackageId : undefined,
        branchId: v.branchId,
        ptId: v.ptId,
        startAt: `${v.bookingDate}T${v.startTime}:00`,
        endAt: `${v.bookingDate}T${v.endTime}:00`,
        note: v.note || undefined,
      });
      // UC-073: áp giảm giá (voucher hoặc điểm — loại trừ nhau) trước checkout; lỗi không chặn đặt lịch.
      if (v.mode === "new" && voucherCode.trim()) {
        try {
          await voucherService.apply(booking.id, voucherCode.trim());
        } catch (err) {
          toast({ type: "warning", title: t("booking.voucherFailed"), description: toErrorMessage(err) });
        }
      } else if (v.mode === "new" && Number(pointsToUse) > 0) {
        try {
          await loyaltyService.apply(booking.id, Number(pointsToUse));
        } catch (err) {
          toast({ type: "warning", title: t("booking.pointsFailed"), description: toErrorMessage(err) });
        }
      }
      // UC-035: checkout ngay sau khi tạo nháp — BE validate đủ điều kiện + chốt giá.
      try {
        const checked = await checkoutAction.mutateAsync({ id: booking.id, action: "checkout" });
        const payable = (checked as Booking).payableAmount ?? 0;
        toast({
          type: "success",
          title: payable > 0 ? t("booking.createdPayNow") : t("booking.sentToGym"),
        });
        reset();
        onCheckedOut(booking.id, payable);
      } catch (checkoutError) {
        // B-31: checkout lỗi -> hủy nháp vừa tạo để không dồn nháp trùng khung giờ.
        await bookingService.cancel(booking.id, { reason: t("booking.autoCancelDraft") }).catch(() => undefined);
        throw checkoutError;
      }
    } catch (error) {
      toast({ type: "error", title: t("booking.createFailed"), description: toErrorMessage(error) });
      // C-2 (UC-044): chỉ mời vào danh sách chờ khi slot thật sự kín/bận (409 do
      // capacity hoặc PT trùng lịch) — không mời khi lỗi cấu hình giờ hoạt động.
      const status = (error as { status?: number })?.status;
      const slotTaken = /kín chỗ|đã có lịch/i.test(toErrorMessage(error));
      if (status === 409 && slotTaken && v.mode === "new" && v.itemId) {
        setWaitlistOffer({
          serviceId: v.itemType === "service" ? v.itemId : undefined,
          packageId: v.itemType === "package" ? v.itemId : undefined,
          preferredStart: `${v.bookingDate}T${v.startTime}:00`,
        });
      }
    }
  });

  const Icon = stepMeta[current].icon;

  return (
    <DialogRoot open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden overflow-y-hidden p-0">
        <header className="border-b border-border bg-card/70 px-5 pb-4 pt-5 sm:px-7">
          <div className="flex items-start gap-3 pr-10">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                {t("booking.wizard.stepOf", { current: safeIndex + 1, total: steps.length })}
              </p>
              <DialogTitle className="truncate text-xl">{stepMeta[current].title}</DialogTitle>
              <DialogDescription className="mt-0.5 line-clamp-2">{stepMeta[current].subtitle}</DialogDescription>
            </div>
          </div>

          <Stepper
            steps={steps.map((id) => stepMeta[id].label)}
            current={safeIndex}
            furthest={furthest}
            onJump={(i) => { setStepError(null); setStepIndex(i); }}
          />
        </header>

        {/* Enter trong ô nhập = "Tiếp", chỉ bước cuối mới thật sự gửi yêu cầu. */}
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(e) => {
            if (current !== "review") {
              e.preventDefault();
              void goNext();
              return;
            }
            void onSubmit(e);
          }}
        >
          <div className="max-h-[52vh] min-h-[280px] overflow-y-auto px-5 py-5 sm:px-7">
            {current === "mode" && (
              <ModeStep
                mode={mode}
                packages={usablePackages}
                selectedPackageId={values.customerPackageId}
                loading={myPackages.isLoading}
                onModeChange={(next) => {
                  form.setValue("mode", next);
                  form.setValue("itemId", 0);
                  form.setValue("customerPackageId", undefined);
                  form.setValue("ptId", undefined);
                  form.setValue("branchId", undefined);
                  setStepError(null);
                }}
                onPickPackage={(id) => {
                  form.setValue("customerPackageId", id);
                  form.setValue("ptId", undefined);
                  form.setValue("branchId", undefined);
                  setStepError(null);
                }}
              />
            )}

            {current === "catalog" && (
              <CatalogStep
                keyword={gymKeyword}
                onKeyword={setGymKeyword}
                gyms={gyms.data?.content ?? []}
                gymsLoading={gyms.isLoading}
                gymId={gymId}
                onPickGym={(id) => {
                  form.setValue("gymId", id);
                  form.setValue("itemId", 0);
                  form.setValue("ptId", undefined);
                  form.setValue("branchId", undefined);
                  setStepError(null);
                }}
                itemType={itemType}
                onItemType={(next) => { form.setValue("itemType", next); form.setValue("itemId", 0); }}
                items={catalogItems}
                itemsLoading={services.isFetching || packages.isFetching}
                itemId={values.itemId ?? 0}
                onPickItem={(id) => { form.setValue("itemId", id); setStepError(null); }}
              />
            )}

            {current === "place" && (
              <PlaceStep
                branches={branches.data ?? []}
                branchesLoading={branches.isLoading}
                branchId={values.branchId}
                onPickBranch={(id) => form.setValue("branchId", id)}
                pts={pts.data?.content ?? []}
                ptsLoading={pts.isLoading}
                ptId={values.ptId}
                onPickPt={(id) => form.setValue("ptId", id)}
              />
            )}

            {current === "time" && (
              <TimeStep
                form={form}
                precheckEnabled={precheckEnabled}
                precheck={precheck.data}
                precheckLoading={precheck.isFetching}
              />
            )}

            {current === "extras" && (
              <ExtrasStep
                mode={mode}
                voucherCode={voucherCode}
                onVoucher={(v) => { setVoucherCode(v.toUpperCase()); if (v) setPointsToUse(""); }}
                points={pointsToUse}
                onPoints={(v) => { setPointsToUse(v); if (v) setVoucherCode(""); }}
                balance={loyalty.data?.pointsBalance ?? 0}
                note={values.note ?? ""}
                onNote={(v) => form.setValue("note", v)}
              />
            )}

            {current === "review" && (
              <ReviewStep
                mode={mode}
                gymName={selectedGym?.gymName ?? selectedPackage?.gymName}
                itemName={selectedItem?.name}
                itemPrice={selectedItem?.price}
                packageName={selectedPackage?.packageName}
                branchName={selectedBranch?.name}
                ptName={selectedPt?.displayName}
                when={`${fmt.date(values.bookingDate)} · ${values.startTime} – ${values.endTime}`}
                note={values.note}
                voucherCode={voucherCode}
                points={Number(pointsToUse) || 0}
                precheckEnabled={precheckEnabled}
                precheck={precheck.data}
                onEdit={(id) => { const i = steps.indexOf(id); if (i >= 0) setStepIndex(i); }}
              />
            )}

            {stepError && (
              <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-bold text-destructive">
                {stepError}
              </p>
            )}

            {waitlistOffer && current === "review" && (
              <div className="mt-4 rounded-2xl border border-warning/30 bg-warning-muted p-4">
                <p className="text-sm font-black text-warning">{t("booking.slotFullOfferTitle")}</p>
                <p className="mt-1 text-xs text-warning">{t("booking.slotFullOfferBody")}</p>
                <div className="mt-2 flex gap-2">
                  <Button type="button" disabled={joinWaitlist.isPending} onClick={() => joinWaitlist.mutate()}>
                    {joinWaitlist.isPending ? t("common.states.processing") : t("booking.joinWaitlist")}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setWaitlistOffer(null)}>{t("booking.skip")}</Button>
                </div>
              </div>
            )}
          </div>

          <footer className="flex items-center justify-between gap-3 border-t border-border bg-muted/40 px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              disabled={safeIndex === 0 || submitting}
              onClick={() => { setStepError(null); setStepIndex((i) => Math.max(0, i - 1)); }}
            >
              <ArrowLeft className="size-4" />{t("common.actions.back")}
            </Button>

            <div className="flex items-center gap-2">
              {current === "review" ? (
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : <CalendarCheck2 className="size-4" />}
                  {submitting ? t("common.states.processing") : t("booking.bookAndPay")}
                </Button>
              ) : (
                <Button type="button" size="lg" onClick={() => void goNext()}>
                  {t("common.actions.next")}<ArrowRight className="size-4" />
                </Button>
              )}
            </div>
          </footer>
        </form>
      </DialogContent>
    </DialogRoot>
  );
}

/* ---------------------------------------------------------------- stepper */

function Stepper({ steps, current, furthest, onJump }: {
  steps: string[];
  current: number;
  furthest: number;
  onJump: (index: number) => void;
}) {
  const percent = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 100;
  return (
    <>
      {/* Mobile: thanh tiến độ gọn — nhãn từng bước đã có ở tiêu đề. */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted sm:hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>

      <ol className="mt-4 hidden items-center gap-1 sm:flex">
        {steps.map((label, index) => {
          const done = index < current;
          const active = index === current;
          const reachable = index <= furthest;
          return (
            // `contents`: nút và đường nối tham gia trực tiếp vào flex của <ol> —
            // nút giữ đúng bề rộng chữ, phần dư dồn hết cho đường nối (không cắt nhãn).
            <li key={label} className="contents">
              <button
                type="button"
                disabled={!reachable}
                onClick={() => reachable && onJump(index)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-2 py-1 text-left transition",
                  reachable ? "cursor-pointer hover:bg-muted" : "cursor-not-allowed",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border text-[11px] font-black transition",
                    done && "border-primary bg-primary text-primary-foreground",
                    active && "border-primary bg-primary/10 text-primary ring-4 ring-primary/15",
                    !done && !active && "border-border bg-card text-muted-foreground",
                  )}
                >
                  {done ? <Check className="size-3.5" /> : index + 1}
                </span>
                {/* Dưới lg chỉ hiện nhãn của bước đang đứng — 6 nhãn cùng lúc sẽ bị cắt chữ. */}
                <span
                  className={cn(
                    "whitespace-nowrap text-xs font-bold",
                    active ? "text-foreground" : "hidden text-muted-foreground lg:block",
                  )}
                >
                  {label}
                </span>
              </button>
              {index < steps.length - 1 && (
                <span className={cn("h-0.5 min-w-2 flex-1 rounded-full", done ? "bg-primary" : "bg-border")} />
              )}
            </li>
          );
        })}
      </ol>
    </>
  );
}

/* ------------------------------------------------------------ choice card */

function ChoiceCard({ selected, disabled, onClick, icon, title, subtitle, meta, badge }: {
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  meta?: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
        selected
          ? "border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20"
          : "border-border bg-card hover:border-primary/50 hover:bg-muted/40",
        disabled && "cursor-not-allowed opacity-55 hover:border-border hover:bg-card",
      )}
    >
      {icon && (
        <span className={cn(
          "mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl transition",
          selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
        )}>
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-black text-foreground">{title}</span>
          {badge}
        </span>
        {subtitle && <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">{subtitle}</span>}
        {meta && <span className="mt-2 block text-xs font-bold text-foreground">{meta}</span>}
      </span>
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card",
        )}
      >
        {selected && <Check className="size-3" />}
      </span>
    </button>
  );
}

function StepSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h3 className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">{title}</h3>
        {hint && <span className="text-[11px] font-semibold text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs font-semibold text-muted-foreground">
      {text}
    </p>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- step: mode */

function ModeStep({ mode, packages, selectedPackageId, loading, onModeChange, onPickPackage }: {
  mode: "new" | "package";
  packages: CustomerPackage[];
  selectedPackageId?: number;
  loading: boolean;
  onModeChange: (mode: "new" | "package") => void;
  onPickPackage: (id: number) => void;
}) {
  const t = useTranslations();
  const fmt = useFormatters();

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <ChoiceCard
          selected={mode === "new"}
          onClick={() => onModeChange("new")}
          icon={<Wallet className="size-4" />}
          title={t("booking.modeNew")}
          subtitle={t("booking.wizard.modeNewDesc")}
        />
        <ChoiceCard
          selected={mode === "package"}
          disabled={!packages.length}
          onClick={() => onModeChange("package")}
          icon={<Ticket className="size-4" />}
          title={t("booking.modePackage")}
          subtitle={packages.length ? t("booking.wizard.modePackageDesc") : t("booking.wizard.noPackagesHint")}
          badge={packages.length ? <Badge variant="success">{packages.length}</Badge> : undefined}
        />
      </div>

      {mode === "package" && (
        <div className="mt-6">
          <StepSection title={t("booking.wizard.packageStepTitle")}>
            {loading ? <ListSkeleton /> : !packages.length ? (
              <EmptyHint text={t("booking.wizard.noPackagesHint")} />
            ) : (
              <div className="grid gap-2">
                {packages.map((p) => (
                  <ChoiceCard
                    key={p.id}
                    selected={selectedPackageId === p.id}
                    onClick={() => onPickPackage(p.id)}
                    title={p.packageName ?? `#${p.id}`}
                    subtitle={[p.gymName, p.expiresAt ? t("booking.wizard.expiresOn", { date: fmt.date(p.expiresAt) }) : null]
                      .filter(Boolean).join(" · ")}
                    meta={t("booking.wizard.sessionsLeft", { left: p.sessionsRemaining, total: p.sessionsTotal })}
                  />
                ))}
              </div>
            )}
          </StepSection>
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------- step: catalog */

function CatalogStep({
  keyword, onKeyword, gyms, gymsLoading, gymId, onPickGym,
  itemType, onItemType, items, itemsLoading, itemId, onPickItem,
}: {
  keyword: string;
  onKeyword: (v: string) => void;
  gyms: Array<{ id?: number; gymName?: string; city?: string; district?: string; averageRating?: number; verified?: boolean }>;
  gymsLoading: boolean;
  gymId: number;
  onPickGym: (id: number) => void;
  itemType: "service" | "package";
  onItemType: (v: "service" | "package") => void;
  items: Array<PublicGymService | PublicTrainingPackage>;
  itemsLoading: boolean;
  itemId: number;
  onPickItem: (id: number) => void;
}) {
  const t = useTranslations();
  const filtered = keyword.trim()
    ? gyms.filter((g) => `${g.gymName ?? ""} ${g.city ?? ""} ${g.district ?? ""}`.toLowerCase().includes(keyword.trim().toLowerCase()))
    : gyms;

  return (
    <div>
      <StepSection title={t("booking.gymLabel")}>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={keyword}
            onChange={(e) => onKeyword(e.target.value)}
            placeholder={t("booking.wizard.searchGym")}
            className="pl-9"
          />
        </div>
        {gymsLoading ? <ListSkeleton /> : !filtered.length ? (
          <EmptyHint text={t("booking.wizard.noGymFound")} />
        ) : (
          <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
            {filtered.map((g) => (
              <ChoiceCard
                key={g.id}
                selected={gymId === g.id}
                onClick={() => onPickGym(g.id!)}
                icon={<Building2 className="size-4" />}
                title={g.gymName ?? `#${g.id}`}
                subtitle={[g.district, g.city].filter(Boolean).join(", ") || undefined}
                badge={g.verified ? <BadgeCheck className="size-4 shrink-0 text-primary" aria-label={t("marketplace.verified")} /> : undefined}
              />
            ))}
          </div>
        )}
      </StepSection>

      <StepSection title={t("booking.typeLabel")}>
        <div className="inline-flex w-full rounded-xl border border-border bg-muted/50 p-1 sm:w-auto">
          {(["service", "package"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onItemType(type)}
              className={cn(
                "flex-1 rounded-lg px-4 py-2 text-xs font-black transition sm:flex-none",
                itemType === type ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {type === "service" ? t("booking.typeSingle") : t("booking.typePackage")}
            </button>
          ))}
        </div>
      </StepSection>

      <StepSection title={itemType === "service" ? t("marketplace.services") : t("booking.typePackage")}>
        {!gymId ? (
          <EmptyHint text={t("booking.selectGymFirst")} />
        ) : itemsLoading ? <ListSkeleton /> : !items.length ? (
          <EmptyHint text={t("booking.gymHasNothing")} />
        ) : (
          <div className="grid gap-2">
            {items.map((item) => {
              const service = item as PublicGymService;
              const pack = item as PublicTrainingPackage;
              const meta = [
                service.durationMinutes ? t("booking.wizard.minutes", { minutes: service.durationMinutes }) : null,
                pack.sessionCount ? t("booking.wizard.sessions", { count: pack.sessionCount }) : null,
                pack.validityDays ? t("booking.wizard.validDays", { days: pack.validityDays }) : null,
              ].filter(Boolean).join(" · ");
              return (
                <ChoiceCard
                  key={item.id}
                  selected={itemId === item.id}
                  onClick={() => onPickItem(item.id!)}
                  title={item.name ?? `#${item.id}`}
                  subtitle={meta || item.description || undefined}
                  meta={money(item.price)}
                />
              );
            })}
          </div>
        )}
      </StepSection>
    </div>
  );
}

/* ------------------------------------------------------------- step: place */

function PlaceStep({ branches, branchesLoading, branchId, onPickBranch, pts, ptsLoading, ptId, onPickPt }: {
  branches: PublicBranch[];
  branchesLoading: boolean;
  branchId?: number;
  onPickBranch: (id?: number) => void;
  pts: PtPublicProfile[];
  ptsLoading: boolean;
  ptId?: number;
  onPickPt: (id?: number) => void;
}) {
  const t = useTranslations();

  return (
    <div>
      <StepSection title={t("booking.wizard.branchStep")} hint={t("common.states.optional")}>
        {branchesLoading ? <ListSkeleton /> : (
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard
              selected={!branchId}
              onClick={() => onPickBranch(undefined)}
              icon={<MapPin className="size-4" />}
              title={t("booking.wizard.anyBranch")}
              subtitle={t("booking.wizard.anyBranchDesc")}
            />
            {branches.map((b) => (
              <ChoiceCard
                key={b.id}
                selected={branchId === b.id}
                onClick={() => onPickBranch(b.id)}
                icon={<MapPin className="size-4" />}
                title={b.name ?? `#${b.id}`}
                subtitle={[b.address, b.district, b.city].filter(Boolean).join(", ") || undefined}
              />
            ))}
          </div>
        )}
        {!branchesLoading && !branches.length && (
          <p className="mt-2 text-xs text-muted-foreground">{t("booking.wizard.noBranches")}</p>
        )}
      </StepSection>

      <StepSection title={t("booking.wizard.trainerStep")} hint={t("common.states.optional")}>
        {ptsLoading ? <ListSkeleton /> : (
          <div className="grid gap-2 sm:grid-cols-2">
            <ChoiceCard
              selected={!ptId}
              onClick={() => onPickPt(undefined)}
              icon={<Sparkles className="size-4" />}
              title={t("booking.wizard.autoAssign")}
              subtitle={t("booking.wizard.autoAssignDesc")}
            />
            {pts.map((p) => (
              <ChoiceCard
                key={p.id}
                selected={ptId === p.id}
                onClick={() => onPickPt(p.id)}
                icon={<UserRound className="size-4" />}
                title={p.displayName ?? `#${p.id}`}
                subtitle={[
                  p.specialization,
                  p.experienceYears ? t("booking.wizard.yearsExp", { years: p.experienceYears }) : null,
                ].filter(Boolean).join(" · ") || undefined}
                badge={p.averageRating ? <Badge variant="warning">★ {p.averageRating.toFixed(1)}</Badge> : undefined}
              />
            ))}
          </div>
        )}
        {!ptsLoading && !pts.length && (
          <p className="mt-2 text-xs text-muted-foreground">{t("booking.wizard.noPts")}</p>
        )}
      </StepSection>
    </div>
  );
}

/* -------------------------------------------------------------- step: time */

function TimeStep({ form, precheckEnabled, precheck, precheckLoading }: {
  form: ReturnType<typeof useForm<z.infer<ReturnType<typeof useBookingSchemas>["createBooking"]>>>;
  precheckEnabled: boolean;
  precheck?: { available: boolean; reasons: string[] };
  precheckLoading: boolean;
}) {
  const t = useTranslations();
  const fmt = useFormatters();
  const errors = form.formState.errors;
  const startTime = form.watch("startTime");
  const bookingDate = form.watch("bookingDate");

  const quickDays = [0, 1, 2, 3].map((offset) => ({
    value: isoDate(offset),
    label: offset === 0 ? t("booking.wizard.today") : offset === 1 ? t("booking.wizard.tomorrow") : fmt.dateShort(isoDate(offset)),
  }));

  return (
    <div>
      <StepSection title={t("booking.bookingDate")}>
        <div className="mb-3 flex flex-wrap gap-2">
          {quickDays.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => form.setValue("bookingDate", d.value, { shouldValidate: true })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-bold transition",
                bookingDate === d.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <Controller
          control={form.control}
          name="bookingDate"
          render={({ field }) => (
            <FieldShell label={t("common.datetime.date")} error={errors.bookingDate}>
              <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} minDate={isoDate()} />
            </FieldShell>
          )}
        />
      </StepSection>

      <StepSection title={t("booking.wizard.timeRangeStep")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldShell label={t("booking.startTime")} error={errors.startTime}>
            <Controller
              control={form.control}
              name="startTime"
              render={({ field }) => <TimePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />}
            />
          </FieldShell>
          <FieldShell label={t("booking.endTime")} error={errors.endTime}>
            <Controller
              control={form.control}
              name="endTime"
              render={({ field }) => <TimePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />}
            />
          </FieldShell>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-wide text-muted-foreground">
            {t("booking.wizard.durationLabel")}
          </span>
          {QUICK_DURATIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => form.setValue("endTime", addMinutes(startTime, minutes), { shouldValidate: true })}
              className="rounded-full border border-border bg-card px-3 py-1 text-xs font-bold text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
            >
              {t("booking.wizard.minutes", { minutes })}
            </button>
          ))}
        </div>
      </StepSection>

      {/* B-31: kết quả pre-check khả dụng cho khung giờ đã chọn */}
      <div className="mt-1">
        {!precheckEnabled ? (
          <p className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Clock className="size-3.5" />{t("booking.wizard.pickTimeToCheck")}
          </p>
        ) : precheckLoading ? (
          <p className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />{t("booking.wizard.checkingSlot")}
          </p>
        ) : precheck ? (
          precheck.available ? (
            <p className="rounded-xl border border-success/30 bg-success-muted px-3 py-2 text-xs font-semibold text-success">
              {t("booking.slotAvailable")}
            </p>
          ) : (
            <div className="rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
              <p className="font-semibold">{t("booking.slotUnavailable")}</p>
              <ul className="mt-1 list-inside list-disc">
                {precheck.reasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ step: extras */

function ExtrasStep({ mode, voucherCode, onVoucher, points, onPoints, balance, note, onNote }: {
  mode: "new" | "package";
  voucherCode: string;
  onVoucher: (v: string) => void;
  points: string;
  onPoints: (v: string) => void;
  balance: number;
  note: string;
  onNote: (v: string) => void;
}) {
  const t = useTranslations();

  return (
    <div>
      {mode === "new" ? (
        <StepSection title={t("booking.wizard.discountStep")} hint={t("common.states.optional")}>
          <div className="grid gap-3 sm:grid-cols-2">
            <FieldShell label={t("booking.voucherOptional")}>
              <Input
                value={voucherCode}
                onChange={(e) => onVoucher(e.target.value)}
                placeholder="VD: SALE10"
                disabled={Number(points) > 0}
              />
            </FieldShell>
            <FieldShell label={t("booking.usePoints", { balance })}>
              <Input
                type="number"
                min={0}
                max={balance}
                value={points}
                onChange={(e) => onPoints(e.target.value)}
                placeholder="0"
                disabled={!!voucherCode.trim() || !balance}
              />
            </FieldShell>
          </div>
          <p className="mt-2 text-[11px] font-semibold text-muted-foreground">{t("booking.wizard.exclusiveHint")}</p>
        </StepSection>
      ) : (
        <p className="mb-5 rounded-2xl border border-success/30 bg-success-muted px-4 py-3 text-xs font-semibold text-success">
          {t("booking.wizard.packageNoCharge")}
        </p>
      )}

      <StepSection title={t("booking.noteOptional")} hint={t("common.states.optional")}>
        <Textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          maxLength={500}
          rows={4}
          placeholder={t("booking.notePlaceholder2")}
        />
      </StepSection>
    </div>
  );
}

/* ------------------------------------------------------------ step: review */

function ReviewStep({
  mode, gymName, itemName, itemPrice, packageName, branchName, ptName, when, note,
  voucherCode, points, precheckEnabled, precheck, onEdit,
}: {
  mode: "new" | "package";
  gymName?: string;
  itemName?: string;
  itemPrice?: number;
  packageName?: string;
  branchName?: string;
  ptName?: string;
  when: string;
  note?: string;
  voucherCode: string;
  points: number;
  precheckEnabled: boolean;
  precheck?: { available: boolean; reasons: string[] };
  onEdit: (step: StepId) => void;
}) {
  const t = useTranslations();

  const rows: Array<{ label: string; value?: string; step: StepId; icon: typeof MapPin }> = [
    { label: t("booking.wizard.summaryGym"), value: gymName, step: mode === "package" ? "mode" : "catalog", icon: Building2 },
    mode === "package"
      ? { label: t("booking.wizard.summaryPackage"), value: packageName, step: "mode" as StepId, icon: Ticket }
      : { label: t("booking.wizard.summaryItem"), value: itemName, step: "catalog" as StepId, icon: Sparkles },
    { label: t("booking.wizard.summaryBranch"), value: branchName ?? t("booking.wizard.anyBranch"), step: "place", icon: MapPin },
    { label: t("booking.wizard.summaryTrainer"), value: ptName ?? t("booking.wizard.autoAssign"), step: "place", icon: UserRound },
    { label: t("booking.wizard.summaryTime"), value: when, step: "time", icon: CalendarDays },
  ];
  if (voucherCode.trim()) rows.push({ label: t("booking.wizard.summaryVoucher"), value: voucherCode.trim(), step: "extras", icon: Ticket });
  if (points > 0) rows.push({ label: t("booking.wizard.summaryPoints"), value: `${points} ${t("booking.pointsUnit")}`, step: "extras", icon: Wallet });
  if (note?.trim()) rows.push({ label: t("booking.wizard.summaryNote"), value: note.trim(), step: "extras", icon: StickyNote });

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {rows.map((row) => (
          <button
            key={row.label}
            type="button"
            onClick={() => onEdit(row.step)}
            className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left transition last:border-b-0 hover:bg-muted/50"
          >
            <row.icon className="size-4 shrink-0 text-primary" />
            <span className="w-28 shrink-0 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
              {row.label}
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">{row.value || "—"}</span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">
            {t("booking.wizard.estimatedTotal")}
          </span>
          <strong className="text-2xl font-black text-foreground">
            {mode === "package" ? t("booking.fromPurchasedPackage") : money(itemPrice)}
          </strong>
        </div>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
          {mode === "package" ? t("booking.fromPackageNote") : t("booking.wizard.estimateHint")}
        </p>
      </div>

      {precheckEnabled && precheck && !precheck.available && (
        <div className="mt-3 rounded-xl border border-warning/30 bg-warning-muted px-3 py-2 text-xs text-warning">
          <p className="font-semibold">{t("booking.slotUnavailable")}</p>
          <ul className="mt-1 list-inside list-disc">
            {precheck.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
