"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LineChart, Plus, Ruler } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { useBookings } from "@/modules/booking/hooks/use-booking";
import { FieldShell, inputClassName, selectClassName } from "@/modules/forms/form-controls";
import type { Measurement } from "@/services/measurement.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { formatDate } from "@/shared/utils/date.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import {
  useCreateMeasurement,
  useCustomerMeasurements,
  useMyMeasurements,
} from "../hooks/use-measurement";
import { createMeasurementSchema } from "../schemas";

const metricFields = [
  "weight",
  "height",
  "bodyFatPercent",
  "muscleMass",
  "waist",
  "chest",
  "arm",
  "thigh",
] as const;

const metricUnit: Record<(typeof metricFields)[number], string> = {
  weight: "kg",
  height: "cm",
  bodyFatPercent: "%",
  muscleMass: "kg",
  waist: "cm",
  chest: "cm",
  arm: "cm",
  thigh: "cm",
};

export function MeasurementsPage({ scope }: { scope: "customer" | "pt" }) {
  if (scope === "customer") return <CustomerMeasurements />;
  return <PtMeasurements />;
}

function MeasurementCard({ m }: { m: Measurement }) {
  const { t } = useTranslation();
  const present = metricFields.filter((f) => m[f] != null);
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-black">
          <Ruler className="size-4 text-lime-600" />
          {m.measurementDate ? formatDate(m.measurementDate) : `#${m.id}`}
        </p>
      </div>
      {present.length ? (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {present.map((f) => (
            <div key={f} className="rounded-xl bg-zinc-50 p-3 dark:bg-zinc-900">
              <p className="text-xs font-bold uppercase text-zinc-400">{t(`measurement.fields.${f}`)}</p>
              <p className="mt-1 text-lg font-black">
                {m[f]}
                <span className="ml-1 text-xs font-semibold text-zinc-400">{metricUnit[f]}</span>
              </p>
            </div>
          ))}
        </div>
      ) : null}
      {m.notes && <p className="mt-3 text-sm text-zinc-500">{m.notes}</p>}
    </article>
  );
}

function CustomerMeasurements() {
  const { t } = useTranslation();
  const query = useMyMeasurements();
  const items = query.data?.content ?? [];
  return (
    <div>
      <Header title={t("measurement.customerTitle")} description={t("measurement.customerDescription")} />
      <div className="mt-5">
        {query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("measurement.loadError")} description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title={t("measurement.empty")} description={t("measurement.emptyDescription")} />
        ) : (
          <div className="grid gap-4">
            {items.map((m) => (
              <MeasurementCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PtMeasurements() {
  const { t } = useTranslation();
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
        title={t("measurement.ptTitle")}
        description={t("measurement.ptDescription")}
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("measurement.create")}
          </Button>
        }
      />
      <div className="mt-5">
        <FieldShell label={t("measurement.customerLabel")}>
          {bookingsQuery.isLoading ? (
            <p className="text-sm text-zinc-500">{t("common.loading")}</p>
          ) : !customers.length ? (
            <p className="text-sm text-zinc-500">{t("measurement.noCustomers")}</p>
          ) : (
            <select
              className={selectClassName}
              value={customerId}
              onChange={(e) => setCustomerId(Number(e.target.value) || 0)}
            >
              <option value={0}>{t("measurement.customerPlaceholder")}</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>#{c.id} · {c.name}</option>
              ))}
            </select>
          )}
        </FieldShell>
      </div>

      <div className="mt-5">
        {customerId <= 0 ? (
          <EmptyState title={t("measurement.selectCustomer")} description={t("measurement.selectCustomerDescription")} />
        ) : query.isLoading ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <EmptyState title={t("measurement.loadError")} description={toErrorMessage(query.error)} />
        ) : !items.length ? (
          <EmptyState title={t("measurement.empty")} description={t("measurement.emptyDescription")} />
        ) : (
          <div className="grid gap-4">
            {items.map((m) => (
              <MeasurementCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </div>

      <CreateMeasurementDialog
        open={creating}
        defaultCustomerId={customerId}
        onClose={() => setCreating(false)}
      />
    </div>
  );
}

function Header({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <LineChart className="size-5 text-lime-600" />
          <div className="h-1 w-10 rounded-full bg-orange-500" />
        </div>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">{description}</p>
      </div>
      {action}
    </section>
  );
}

function CreateMeasurementDialog({
  open,
  defaultCustomerId,
  onClose,
}: {
  open: boolean;
  defaultCustomerId: number;
  onClose: () => void;
}) {
  const { t } = useTranslation();
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
    <Dialog open={open} title={t("measurement.create")} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (v) => {
          try {
            await mutation.mutateAsync(v);
            toast({ type: "success", title: t("measurement.created") });
            form.reset();
            onClose();
          } catch (e) {
            toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(e) });
          }
        })}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FieldShell label={t("measurement.customerLabel")} error={form.formState.errors.customerId}>
            {customers.length ? (
              <select className={selectClassName} {...form.register("customerId", { valueAsNumber: true })}>
                <option value={0}>{t("measurement.customerPlaceholder")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>#{c.id} · {c.name}</option>
                ))}
              </select>
            ) : (
              <input type="number" className={inputClassName} {...form.register("customerId", { valueAsNumber: true })} />
            )}
          </FieldShell>
          <FieldShell label={t("measurement.date")} error={form.formState.errors.measurementDate}>
            <input type="date" className={inputClassName} {...form.register("measurementDate")} />
          </FieldShell>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {metricFields.map((f) => (
            <FieldShell key={f} label={`${t(`measurement.fields.${f}`)} (${metricUnit[f]})`} error={form.formState.errors[f]}>
              <input type="number" step="any" className={inputClassName} {...form.register(f, { valueAsNumber: true })} />
            </FieldShell>
          ))}
        </div>
        <FieldShell label={t("measurement.notes")} error={form.formState.errors.notes}>
          <textarea className={inputClassName} {...form.register("notes")} />
        </FieldShell>
        <Button disabled={mutation.isPending}>
          <Ruler className="size-4" />
          {t("measurement.submit")}
        </Button>
      </form>
    </Dialog>
  );
}
