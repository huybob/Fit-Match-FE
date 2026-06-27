"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LineChart, Plus, Ruler } from "lucide-react";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { useBookings } from "@/modules/booking/hooks/use-booking";
import { FieldShell } from "@/modules/forms/form-controls";
import type { Measurement } from "@/services/measurement.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Textarea } from "@/shared/components/ui/textarea";
import { formatDate } from "@/shared/utils/date.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useCreateMeasurement,
  useCustomerMeasurements,
  useMyMeasurements,
} from "../hooks/use-measurement";
import { createMeasurementSchema } from "../schemas";

const metricFields = [
  "weight", "height", "bodyFatPercent", "muscleMass",
  "waist", "chest", "arm", "thigh",
] as const;

const metricUnit: Record<(typeof metricFields)[number], string> = {
  weight: "kg", height: "cm", bodyFatPercent: "%", muscleMass: "kg",
  waist: "cm", chest: "cm", arm: "cm", thigh: "cm",
};

const metricFieldLabels: Record<(typeof metricFields)[number], string> = {
  weight: "Cân nặng",
  height: "Chiều cao",
  bodyFatPercent: "Tỷ lệ mỡ cơ thể",
  muscleMass: "Khối cơ",
  waist: "Vòng eo",
  chest: "Vòng ngực",
  arm: "Vòng tay",
  thigh: "Vòng đùi",
};

export function MeasurementsPage({ scope }: { scope: "customer" | "pt" }) {
  if (scope === "customer") return <CustomerMeasurements />;
  return <PtMeasurements />;
}

function MeasurementCard({ m }: { m: Measurement }) {
  const present = metricFields.filter((f) => m[f] != null);
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-black">
          <Ruler className="size-4 text-primary" />
          {m.measurementDate ? formatDate(m.measurementDate) : `#${m.id}`}
        </p>
      </div>
      {present.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {present.map((f) => (
            <div key={f} className="rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-bold uppercase text-muted-foreground">{metricFieldLabels[f]}</p>
              <p className="mt-1 text-lg font-black">
                {m[f]}
                <span className="ml-1 text-xs font-semibold text-muted-foreground">{metricUnit[f]}</span>
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {m.notes && <p className="mt-3 text-sm text-muted-foreground">{m.notes}</p>}
    </article>
  );
}

function CustomerMeasurements() {
  const query = useMyMeasurements();
  const items = query.data?.content ?? [];
  return (
    <div>
      <Header title="Chỉ số cơ thể của tôi" description="Theo dõi sự thay đổi chỉ số cơ thể theo thời gian." />
      <div className="mt-5">
        {query.isLoading ? <LoadingSkeleton /> : query.isError ? (
          <EmptyState title="Không thể tải dữ liệu" description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title="Chưa có chỉ số" description="Chưa có dữ liệu chỉ số cơ thể nào được ghi nhận." />
        ) : (
          <div className="grid gap-4">{items.map((m) => <MeasurementCard key={m.id} m={m} />)}</div>
        )}
      </div>
    </div>
  );
}

function PtMeasurements() {
  const [customerId, setCustomerId] = useState(0);
  const [creating, setCreating] = useState(false);
  const bookingsQuery = useBookings("pt", { page: 0, size: 100 });
  const customers = useMemo(() => {
    const seen = new Map<number, string>();
    bookingsQuery.data?.content?.forEach((b) => {
      if (b.customerId && !seen.has(b.customerId)) seen.set(b.customerId, b.customerName ?? `#${b.customerId}`);
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [bookingsQuery.data]);
  const query = useCustomerMeasurements(customerId);
  const items = query.data ?? [];

  return (
    <div>
      <Header
        title="Chỉ số cơ thể học viên"
        description="Quản lý và theo dõi chỉ số cơ thể của học viên."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />Tạo mới chỉ số
          </Button>
        }
      />
      <div className="mt-5">
        {bookingsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Đang xử lý...</p>
        ) : !customers.length ? (
          <p className="text-sm text-muted-foreground">Chưa có học viên nào.</p>
        ) : (
          <Select
            value={String(customerId)}
            onValueChange={(v) => setCustomerId(Number(v) || 0)}
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Chọn học viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Chọn học viên</SelectItem>
              {customers.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>#{c.id} · {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="mt-5">
        {customerId <= 0 ? (
          <EmptyState title="Chọn học viên" description="Vui lòng chọn học viên để xem chỉ số cơ thể." />
        ) : query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title="Không thể tải dữ liệu" description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title="Chưa có chỉ số" description="Chưa có dữ liệu chỉ số cơ thể nào được ghi nhận." />
        ) : (
          <div className="grid gap-4">{items.map((m) => <MeasurementCard key={m.id} m={m} />)}</div>
        )}
      </div>

      <CreateMeasurementDialog open={creating} defaultCustomerId={customerId} onClose={() => setCreating(false)} />
    </div>
  );
}

function Header({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <LineChart className="size-5 text-primary" />
          <div className="h-1 w-10 rounded-full bg-accent" />
        </div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </section>
  );
}

function CreateMeasurementDialog({ open, defaultCustomerId, onClose }: {
  open: boolean; defaultCustomerId: number; onClose: () => void;
}) {
  const { toast } = useToast();
  const mutation = useCreateMeasurement();
  const bookingsQuery = useBookings("pt", { page: 0, size: 100 });
  const customers = useMemo(() => {
    const seen = new Map<number, string>();
    bookingsQuery.data?.content?.forEach((b) => {
      if (b.customerId && !seen.has(b.customerId)) seen.set(b.customerId, b.customerName ?? `#${b.customerId}`);
    });
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [bookingsQuery.data]);
  const form = useForm<z.infer<typeof createMeasurementSchema>>({
    resolver: zodResolver(createMeasurementSchema),
    defaultValues: { customerId: defaultCustomerId || undefined, measurementDate: "" },
  });

  return (
    <Dialog open={open} title="Tạo mới chỉ số" onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: "Đã tạo chỉ số thành công" });
            form.reset();
            onClose();
          } catch (e) {
            toast({ type: "error", title: "Yêu cầu thất bại", description: toErrorMessage(e) });
          }
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label="Học viên" error={form.formState.errors.customerId}>
            {customers.length ? (
              <Controller
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn học viên" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>#{c.id} · {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            ) : (
              <Input type="number" {...form.register("customerId", { valueAsNumber: true })} />
            )}
          </FieldShell>
          <FieldShell label="Ngày đo" error={form.formState.errors.measurementDate}>
            <Controller
              control={form.control}
              name="measurementDate"
              render={({ field }) => (
                <DatePicker value={field.value} onChange={field.onChange} />
              )}
            />
          </FieldShell>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {metricFields.map((f) => (
            <FieldShell key={f} label={`${metricFieldLabels[f]} (${metricUnit[f]})`} error={form.formState.errors[f]}>
              <Input type="number" step="any" {...form.register(f, { valueAsNumber: true })} />
            </FieldShell>
          ))}
        </div>
        <FieldShell label="Ghi chú" error={form.formState.errors.notes}>
          <Textarea {...form.register("notes")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Ruler className="size-4" />Lưu chỉ số
        </Button>
      </form>
    </Dialog>
  );
}
