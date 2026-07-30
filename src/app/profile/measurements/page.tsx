"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Package, Pencil, Plus, Ruler, Scale, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";
import { bookingService } from "@/services/booking.service";
import {
  measurementService,
  type BodyMeasurement,
  type BodyMeasurementInput,
} from "@/services/measurement.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { PageHeader } from "@/shared/components/common/page-header";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Textarea } from "@/shared/components/ui/textarea";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/use-formatters";

// Khớp validation BE (BodyMeasurementRequest): ngày bắt buộc ≤ hôm nay, chỉ số optional trong khoảng hợp lệ.
// Input number của RHF trả string — giữ string trong form, convert khi submit (tránh lệch type với zod coerce).
/**
 * Schema là FACTORY nhận `t` vì message validation phải đi qua i18n, mà t()
 * chỉ gọi được trong component. Khoảng giá trị giữ nguyên để khớp BE.
 */
/**
 * Schema nhận sẵn CHUỖI đã dịch (không nhận `t`): với hơn 1000 key, union kiểu
 * của next-intl vượt giới hạn TS khi dùng làm tham số generic (TS2590).
 * Truyền chuỗi cũng tách schema khỏi i18n. Khoảng giá trị giữ nguyên để khớp BE.
 */
export interface MeasurementMessages {
  pickDate: string;
  dateNotFuture: string;
  noteMax: string;
  /** BUG-02: form trắng vẫn tạo được bản ghi rỗng — cần chặn ở cả FE và BE. */
  atLeastOneMetric: string;
  /** Message "X phải từ min đến max" đã dựng sẵn cho từng field. */
  range: Record<"weightKg" | "heightCm" | "bodyFatPercent" | "chestCm" | "waistCm" | "hipCm", string>;
}

const numberIn = (min: number, max: number, message: string) =>
  z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    message,
  );

const buildMeasurementSchema = (m: MeasurementMessages) =>
  z.object({
    measuredAt: z
      .string()
      .min(1, m.pickDate)
      .refine((v) => v <= new Date().toISOString().slice(0, 10), m.dateNotFuture),
    weightKg: numberIn(20, 400, m.range.weightKg),
    heightCm: numberIn(80, 250, m.range.heightCm),
    bodyFatPercent: numberIn(1, 70, m.range.bodyFatPercent),
    chestCm: numberIn(30, 250, m.range.chestCm),
    waistCm: numberIn(30, 250, m.range.waistCm),
    hipCm: numberIn(30, 250, m.range.hipCm),
    note: z.string().max(500, m.noteMax),
  })
    // BUG-02: phải có tối thiểu một chỉ số. Ghi chú KHÔNG tính — bản ghi chỉ có
    // text thì không đo được gì, chỉ làm rác biểu đồ tiến trình và lệch BMI.
    // Lỗi gắn vào `weightKg` để hiện ngay dưới ô đầu tiên thay vì trôi mất.
    .refine(
      (v) =>
        [v.weightKg, v.heightCm, v.bodyFatPercent, v.chestCm, v.waistCm, v.hipCm]
          .some((field) => field.trim() !== ""),
      { message: m.atLeastOneMetric, path: ["weightKg"] },
    );

type MeasurementValues = z.infer<ReturnType<typeof buildMeasurementSchema>>;

const emptyValues: MeasurementValues = {
  measuredAt: new Date().toISOString().slice(0, 10),
  weightKg: "",
  heightCm: "",
  bodyFatPercent: "",
  chestCm: "",
  waistCm: "",
  hipCm: "",
  note: "",
};

function toPayload(v: MeasurementValues): BodyMeasurementInput {
  const num = (x: string) => (x === "" ? undefined : Number(x));
  return {
    measuredAt: v.measuredAt,
    weightKg: num(v.weightKg),
    heightCm: num(v.heightCm),
    bodyFatPercent: num(v.bodyFatPercent),
    chestCm: num(v.chestCm),
    waistCm: num(v.waistCm),
    hipCm: num(v.hipCm),
    note: v.note || undefined,
  };
}


export default function MeasurementsRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_CUSTOMER"]}>
        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <MeasurementsContent />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}

function MeasurementsContent() {
  const t = useTranslations();
  const fmt = useFormatters();
  const schema = useMemo(
    () =>
      buildMeasurementSchema({
        pickDate: t("member.measurements.pickDate"),
        dateNotFuture: t("member.measurements.dateNotFuture"),
        noteMax: t("member.measurements.noteMax"),
        atLeastOneMetric: t("member.measurements.atLeastOneMetric"),
        range: {
          weightKg: t("common.validation.between", { field: t("member.measurements.field.weightKg"), min: 20, max: 400 }),
          heightCm: t("common.validation.between", { field: t("member.measurements.field.heightCm"), min: 80, max: 250 }),
          bodyFatPercent: t("common.validation.between", { field: t("member.measurements.field.bodyFatPercent"), min: 1, max: 70 }),
          chestCm: t("common.validation.between", { field: t("member.measurements.field.chestCm"), min: 30, max: 250 }),
          waistCm: t("common.validation.between", { field: t("member.measurements.field.waistCm"), min: 30, max: 250 }),
          hipCm: t("common.validation.between", { field: t("member.measurements.field.hipCm"), min: 30, max: 250 }),
        },
      }),
    [t],
  );
  const { toast } = useToast();
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BodyMeasurement | null>(null);
  const [deleting, setDeleting] = useState<BodyMeasurement | null>(null);

  const query = useQuery({
    queryKey: ["measurements"],
    queryFn: () => measurementService.list(),
  });
  const packagesQuery = useQuery({
    queryKey: ["my-packages"],
    queryFn: bookingService.myPackages,
  });

  const form = useForm<MeasurementValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: emptyValues,
  });

  const saveMut = useMutation({
    mutationFn: (values: MeasurementValues) =>
      editing?.id
        ? measurementService.update(editing.id, toPayload(values))
        : measurementService.create(toPayload(values)),
    onSuccess: () => {
      toast({ type: "success", title: editing ? t("member.measurements.updated") : t("member.measurements.created") });
      qc.invalidateQueries({ queryKey: ["measurements"] });
      closeForm();
    },
    onError: (e) => toast({ type: "error", title: t("member.measurements.saveFailed"), description: toErrorMessage(e) }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => measurementService.remove(id),
    onSuccess: () => {
      toast({ type: "success", title: t("member.measurements.deleted") });
      qc.invalidateQueries({ queryKey: ["measurements"] });
      setDeleting(null);
    },
    onError: (e) => toast({ type: "error", title: t("member.measurements.deleteFailed"), description: toErrorMessage(e) }),
  });

  function openCreate() {
    setEditing(null);
    form.reset(emptyValues);
    setFormOpen(true);
  }
  function openEdit(m: BodyMeasurement) {
    setEditing(m);
    const s = (x?: number) => (x == null ? "" : String(x));
    form.reset({
      measuredAt: m.measuredAt ?? emptyValues.measuredAt,
      weightKg: s(m.weightKg),
      heightCm: s(m.heightCm),
      bodyFatPercent: s(m.bodyFatPercent),
      chestCm: s(m.chestCm),
      waistCm: s(m.waistCm),
      hipCm: s(m.hipCm),
      note: m.note ?? "",
    });
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  const items = query.data?.content ?? [];
  // BE trả mới nhất trước (sort measuredAt desc) — delta so với lần đo liền trước.
  const latest = items[0];
  const previous = items[1];
  const weightDelta =
    latest?.weightKg != null && previous?.weightKg != null
      ? Number((latest.weightKg - previous.weightKg).toFixed(1))
      : null;
  const activePackages = (packagesQuery.data ?? []).filter((p) => p.status === "ACTIVE");

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title={t("member.measurements.title")}
          description={t("member.measurements.subtitle")}
        />
        <Button onClick={openCreate} className="shrink-0 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="size-4" /> {t("member.measurements.add")}
        </Button>
      </div>

      {/* Chỉ số mới nhất */}
      {latest && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Scale className="size-4 text-primary" />}
            label={t("member.measurements.latestWeight")}
            value={latest.weightKg != null ? `${latest.weightKg} kg` : "—"}
            sub={
              weightDelta == null
                ? fmt.date(latest.measuredAt)
                : t("member.measurements.weightDelta", { delta: `${weightDelta > 0 ? "+" : ""}${weightDelta}` })
            }
            subClass={weightDelta == null ? undefined : weightDelta > 0 ? "text-warning" : "text-success"}
          />
          <StatCard
            icon={<Activity className="size-4 text-primary" />}
            label="BMI"
            value={latest.bmi != null ? String(latest.bmi) : "—"}
            sub={
              latest.heightCm != null
                ? t("member.measurements.heightValue", { height: latest.heightCm })
                : t("member.measurements.needWeightHeight")
            }
          />
          <StatCard
            icon={<Ruler className="size-4 text-primary" />}
            label={t("member.measurements.bodyFat")}
            value={latest.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"}
            sub={fmt.date(latest.measuredAt)}
          />
        </div>
      )}

      {/* Gói tập đang dùng */}
      {activePackages.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-black">{t("member.measurements.activePackages")}</h2>
          <div className="space-y-3">
            {activePackages.map((p) => {
              const pct = p.sessionsTotal > 0 ? Math.round((p.sessionsUsed / p.sessionsTotal) * 100) : 0;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-bold">
                      <Package className="size-4 text-primary" />
                      {p.packageName ?? t("member.measurements.packageFallback", { id: p.packageId ?? p.id })}
                      {p.gymName && <span className="text-xs font-normal text-muted-foreground">· {p.gymName}</span>}
                    </p>
                    <p className="text-sm font-bold">
                      {t("member.measurements.sessionsUsed", { used: p.sessionsUsed ?? 0, total: p.sessionsTotal ?? 0 })}
                    </p>
                  </div>
                  <Progress value={pct} className="mt-2 h-2" />
                  {p.expiresAt && (
                    <p className="mt-1.5 text-xs text-muted-foreground">{t("member.measurements.expiresAt")} {fmt.date(p.expiresAt)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* {t("member.measurements.history")} */}
      <h2 className="mb-3 text-lg font-black">{t("member.measurements.history")}</h2>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title={t("member.measurements.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState
          title={t("member.measurements.empty")}
          description={t("member.measurements.emptyHint")}
        />
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{fmt.date(m.measuredAt)}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {m.weightKg != null && <span>{t("member.measurements.weightShort")} <b className="text-foreground">{m.weightKg} kg</b></span>}
                    {m.bmi != null && <span>BMI: <b className="text-foreground">{m.bmi}</b></span>}
                    {m.bodyFatPercent != null && <span>{t("member.measurements.fatShort")} <b className="text-foreground">{m.bodyFatPercent}%</b></span>}
                    {m.chestCm != null && <span>{t("member.measurements.chestShort")} <b className="text-foreground">{m.chestCm} cm</b></span>}
                    {m.waistCm != null && <span>Eo: <b className="text-foreground">{m.waistCm} cm</b></span>}
                    {m.hipCm != null && <span>{t("member.measurements.hipShort")} <b className="text-foreground">{m.hipCm} cm</b></span>}
                  </div>
                  {m.note && <p className="mt-1.5 text-sm text-muted-foreground">{m.note}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label={t("common.actions.edit")} onClick={() => openEdit(m)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={t("common.actions.delete")}
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleting(m)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Form thêm/sửa */}
      <Dialog open={formOpen} title={editing ? t("member.measurements.editTitle") : t("member.measurements.add")} onClose={closeForm}>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-3">
          <Field label={t("member.measurements.field.measuredAt")} error={form.formState.errors.measuredAt?.message}>
            <Controller
              control={form.control}
              name="measuredAt"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={(v) => field.onChange(v ?? "")} />
              )}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("member.measurements.field.weightKg")} error={form.formState.errors.weightKg?.message}>
              <Input type="number" step="0.1" placeholder="72.5" {...form.register("weightKg")} />
            </Field>
            <Field label={t("member.measurements.field.heightCm")} error={form.formState.errors.heightCm?.message}>
              <Input type="number" step="0.1" placeholder="175" {...form.register("heightCm")} />
            </Field>
            <Field label={t("member.measurements.field.bodyFatPercent")} error={form.formState.errors.bodyFatPercent?.message}>
              <Input type="number" step="0.1" placeholder="18" {...form.register("bodyFatPercent")} />
            </Field>
            <Field label={t("member.measurements.field.chestCm")} error={form.formState.errors.chestCm?.message}>
              <Input type="number" step="0.1" placeholder="98" {...form.register("chestCm")} />
            </Field>
            <Field label={t("member.measurements.field.waistCm")} error={form.formState.errors.waistCm?.message}>
              <Input type="number" step="0.1" placeholder="80" {...form.register("waistCm")} />
            </Field>
            <Field label={t("member.measurements.field.hipCm")} error={form.formState.errors.hipCm?.message}>
              <Input type="number" step="0.1" placeholder="95" {...form.register("hipCm")} />
            </Field>
          </div>
          <Field label={t("member.measurements.field.note")} error={form.formState.errors.note?.message}>
            <Textarea rows={2} placeholder={t("member.measurements.notePlaceholder")} {...form.register("note")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeForm}>{t("common.actions.cancel")}</Button>
            <Button type="submit" disabled={saveMut.isPending} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {saveMut.isPending ? t("common.states.saving") : editing ? t("common.actions.update") : t("member.measurements.save")}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deleting} title={t("member.measurements.deleteTitle")} onClose={() => setDeleting(null)}>
        <p className="text-sm text-muted-foreground">
          {t("member.measurements.deleteBody", { date: fmt.date(deleting?.measuredAt) })}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>{t("common.actions.cancel")}</Button>
          <Button
            variant="destructive"
            disabled={deleteMut.isPending}
            onClick={() => deleting?.id && deleteMut.mutate(deleting.id)}
          >
            {deleteMut.isPending ? t("common.states.deleting") : t("common.actions.delete")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, subClass,
}: { icon: React.ReactNode; label: string; value: string; sub?: string; subClass?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-muted-foreground">
        {icon} {label}
      </p>
      <p className="mt-1 text-2xl font-black">{value}</p>
      {sub && <p className={`mt-0.5 text-xs ${subClass ?? "text-muted-foreground"}`}>{sub}</p>}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-foreground">
      {label}
      {children}
      {error && <span className="text-xs font-normal text-destructive">{error}</span>}
    </label>
  );
}
