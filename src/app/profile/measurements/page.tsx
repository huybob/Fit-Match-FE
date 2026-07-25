"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Package, Pencil, Plus, Ruler, Scale, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
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

// Khớp validation BE (BodyMeasurementRequest): ngày bắt buộc ≤ hôm nay, chỉ số optional trong khoảng hợp lệ.
// Input number của RHF trả string — giữ string trong form, convert khi submit (tránh lệch type với zod coerce).
const numberIn = (min: number, max: number, label: string) =>
  z.string().refine(
    (v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= min && Number(v) <= max),
    `${label} phải từ ${min} đến ${max}`,
  );

const measurementSchema = z.object({
  measuredAt: z
    .string()
    .min(1, "Chọn ngày đo")
    .refine((v) => v <= new Date().toISOString().slice(0, 10), "Ngày đo không được ở tương lai"),
  weightKg: numberIn(20, 400, "Cân nặng (kg)"),
  heightCm: numberIn(80, 250, "Chiều cao (cm)"),
  bodyFatPercent: numberIn(1, 70, "Tỷ lệ mỡ (%)"),
  chestCm: numberIn(30, 250, "Vòng ngực (cm)"),
  waistCm: numberIn(30, 250, "Vòng eo (cm)"),
  hipCm: numberIn(30, 250, "Vòng mông (cm)"),
  note: z.string().max(500, "Ghi chú tối đa 500 ký tự"),
});
type MeasurementValues = z.infer<typeof measurementSchema>;

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

function dateText(v?: string) {
  return v ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(new Date(v)) : "";
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
    resolver: zodResolver(measurementSchema),
    mode: "onTouched",
    defaultValues: emptyValues,
  });

  const saveMut = useMutation({
    mutationFn: (values: MeasurementValues) =>
      editing?.id
        ? measurementService.update(editing.id, toPayload(values))
        : measurementService.create(toPayload(values)),
    onSuccess: () => {
      toast({ type: "success", title: editing ? "Đã cập nhật số đo" : "Đã ghi nhận số đo" });
      qc.invalidateQueries({ queryKey: ["measurements"] });
      closeForm();
    },
    onError: (e) => toast({ type: "error", title: "Không lưu được", description: toErrorMessage(e) }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => measurementService.remove(id),
    onSuccess: () => {
      toast({ type: "success", title: "Đã xóa số đo" });
      qc.invalidateQueries({ queryKey: ["measurements"] });
      setDeleting(null);
    },
    onError: (e) => toast({ type: "error", title: "Không xóa được", description: toErrorMessage(e) }),
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
          title="Tiến trình tập luyện"
          description="Theo dõi số đo cơ thể và mức sử dụng gói tập của bạn (UC-051)."
        />
        <Button onClick={openCreate} className="shrink-0 gap-2 bg-primary text-white hover:bg-primary/90">
          <Plus className="size-4" /> Thêm số đo
        </Button>
      </div>

      {/* Chỉ số mới nhất */}
      {latest && (
        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <StatCard
            icon={<Scale className="size-4 text-primary" />}
            label="Cân nặng mới nhất"
            value={latest.weightKg != null ? `${latest.weightKg} kg` : "—"}
            sub={
              weightDelta == null
                ? dateText(latest.measuredAt)
                : `${weightDelta > 0 ? "+" : ""}${weightDelta} kg so với lần trước`
            }
            subClass={weightDelta == null ? undefined : weightDelta > 0 ? "text-amber-600" : "text-emerald-600"}
          />
          <StatCard
            icon={<Activity className="size-4 text-primary" />}
            label="BMI"
            value={latest.bmi != null ? String(latest.bmi) : "—"}
            sub={latest.heightCm != null ? `Chiều cao ${latest.heightCm} cm` : "Cần cân nặng + chiều cao"}
          />
          <StatCard
            icon={<Ruler className="size-4 text-primary" />}
            label="Tỷ lệ mỡ"
            value={latest.bodyFatPercent != null ? `${latest.bodyFatPercent}%` : "—"}
            sub={dateText(latest.measuredAt)}
          />
        </div>
      )}

      {/* Gói tập đang dùng */}
      {activePackages.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 text-lg font-black">Gói tập đang sử dụng</h2>
          <div className="space-y-3">
            {activePackages.map((p) => {
              const pct = p.sessionsTotal > 0 ? Math.round((p.sessionsUsed / p.sessionsTotal) * 100) : 0;
              return (
                <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-2 font-bold">
                      <Package className="size-4 text-primary" />
                      {p.packageName ?? `Gói #${p.packageId ?? p.id}`}
                      {p.gymName && <span className="text-xs font-normal text-muted-foreground">· {p.gymName}</span>}
                    </p>
                    <p className="text-sm font-bold">
                      {p.sessionsUsed}/{p.sessionsTotal} buổi
                    </p>
                  </div>
                  <Progress value={pct} className="mt-2 h-2" />
                  {p.expiresAt && (
                    <p className="mt-1.5 text-xs text-muted-foreground">Hết hạn: {dateText(p.expiresAt)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lịch sử số đo */}
      <h2 className="mb-3 text-lg font-black">Lịch sử số đo</h2>
      {query.isLoading ? (
        <LoadingSkeleton />
      ) : query.isError ? (
        <EmptyState title="Không tải được số đo" description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState
          title="Chưa có số đo nào"
          description="Ghi nhận số đo đầu tiên để bắt đầu theo dõi tiến trình."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((m) => (
            <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{dateText(m.measuredAt)}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {m.weightKg != null && <span>Cân nặng: <b className="text-foreground">{m.weightKg} kg</b></span>}
                    {m.bmi != null && <span>BMI: <b className="text-foreground">{m.bmi}</b></span>}
                    {m.bodyFatPercent != null && <span>Mỡ: <b className="text-foreground">{m.bodyFatPercent}%</b></span>}
                    {m.chestCm != null && <span>Ngực: <b className="text-foreground">{m.chestCm} cm</b></span>}
                    {m.waistCm != null && <span>Eo: <b className="text-foreground">{m.waistCm} cm</b></span>}
                    {m.hipCm != null && <span>Mông: <b className="text-foreground">{m.hipCm} cm</b></span>}
                  </div>
                  {m.note && <p className="mt-1.5 text-sm text-muted-foreground">{m.note}</p>}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Sửa" onClick={() => openEdit(m)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Xóa"
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
      <Dialog open={formOpen} title={editing ? "Sửa số đo" : "Thêm số đo"} onClose={closeForm}>
        <form onSubmit={form.handleSubmit((v) => saveMut.mutate(v))} className="space-y-3">
          <Field label="Ngày đo *" error={form.formState.errors.measuredAt?.message}>
            <Input type="date" {...form.register("measuredAt")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cân nặng (kg)" error={form.formState.errors.weightKg?.message}>
              <Input type="number" step="0.1" placeholder="72.5" {...form.register("weightKg")} />
            </Field>
            <Field label="Chiều cao (cm)" error={form.formState.errors.heightCm?.message}>
              <Input type="number" step="0.1" placeholder="175" {...form.register("heightCm")} />
            </Field>
            <Field label="Tỷ lệ mỡ (%)" error={form.formState.errors.bodyFatPercent?.message}>
              <Input type="number" step="0.1" placeholder="18" {...form.register("bodyFatPercent")} />
            </Field>
            <Field label="Vòng ngực (cm)" error={form.formState.errors.chestCm?.message}>
              <Input type="number" step="0.1" placeholder="98" {...form.register("chestCm")} />
            </Field>
            <Field label="Vòng eo (cm)" error={form.formState.errors.waistCm?.message}>
              <Input type="number" step="0.1" placeholder="80" {...form.register("waistCm")} />
            </Field>
            <Field label="Vòng mông (cm)" error={form.formState.errors.hipCm?.message}>
              <Input type="number" step="0.1" placeholder="95" {...form.register("hipCm")} />
            </Field>
          </div>
          <Field label="Ghi chú" error={form.formState.errors.note?.message}>
            <Textarea rows={2} placeholder="Cảm nhận, mục tiêu..." {...form.register("note")} />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={closeForm}>Hủy</Button>
            <Button type="submit" disabled={saveMut.isPending} className="bg-primary text-white hover:bg-primary/90">
              {saveMut.isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Lưu số đo"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={!!deleting} title="Xóa số đo?" onClose={() => setDeleting(null)}>
        <p className="text-sm text-muted-foreground">
          Xóa bản ghi ngày {dateText(deleting?.measuredAt)} — không thể hoàn tác.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>Hủy</Button>
          <Button
            variant="destructive"
            disabled={deleteMut.isPending}
            onClick={() => deleting?.id && deleteMut.mutate(deleting.id)}
          >
            {deleteMut.isPending ? "Đang xóa..." : "Xóa"}
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
      {error && <span className="text-xs font-normal text-red-500">{error}</span>}
    </label>
  );
}
