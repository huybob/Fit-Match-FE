"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell } from "@/modules/forms/form-controls";
import { Booking, BookingStatus } from "@/services/booking.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
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
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useSearchGyms, useGymBranches } from "@/modules/gym/hooks/use-gym";
import { useGetPublicTrainer, useGetPublicTrainerServices } from "@/modules/trainer/hooks/use-trainer";
import { useBookingAction, useBookings, useCreateBooking } from "../hooks/use-booking";
import { createBookingSchema } from "../schemas";

type Scope = "customer" | "pt" | "gym";
type BookingAction = "submit" | "confirm" | "checkIn" | "complete" | "noShow" | "cancel";
const statuses: BookingStatus[] = ["DRAFT", "PENDING", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];

function dateText(value: string | undefined, language: string) {
  return value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`)) : "—";
}
function timeText(value?: string | { hour?: number; minute?: number }) {
  if (typeof value === "string") return value.slice(0, 5);
  return value ? `${String(value.hour ?? 0).padStart(2, "0")}:${String(value.minute ?? 0).padStart(2, "0")}` : "—";
}
function money(value: number | undefined, language: string) {
  return new Intl.NumberFormat(language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value ?? 0);
}
function statusVariant(status?: BookingStatus): React.ComponentProps<typeof Badge>["variant"] {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED" || status === "NO_SHOW") return "destructive";
  if (status === "CONFIRMED" || status === "CHECKED_IN") return "info";
  if (status === "PENDING") return "warning";
  return "default";
}

export function BookingWorkspacePage({ scope }: { scope: Scope }) {
  const { t, i18n } = useTranslation();
  const [status, setStatus] = useState<BookingStatus | "">("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useBookings(scope, { status: status || undefined, date: scope === "customer" ? undefined : date || undefined, page, size: 10 });
  const items = query.data?.content ?? [];

  return (
    <div>
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-border bg-card/80 p-6 shadow-sm sm:p-7">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 h-1 w-10 rounded-full bg-accent" />
            <h1 className="text-3xl font-black tracking-tight">{t(`bookingModule.${scope}Title`)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t(`bookingModule.${scope}Description`)}</p>
          </div>
          {scope === "customer" && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="size-4" />{t("bookingModule.create")}
            </Button>
          )}
        </div>
      </section>

      <section className="mb-5 grid gap-3 rounded-2xl border border-border bg-card/80 p-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("bookingModule.status")}</span>
          <Select value={status} onValueChange={(v) => { setStatus(v as BookingStatus | ""); setPage(0); }}>
            <SelectTrigger>
              <SelectValue placeholder={t("bookingModule.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("bookingModule.allStatuses")}</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{t(`bookingModule.statuses.${s}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {scope !== "customer" && (
          <div className="grid gap-1.5">
            <span className="text-xs font-black uppercase tracking-wide text-muted-foreground">{t("bookingModule.date")}</span>
            <DatePicker value={date} onChange={(v) => { setDate(v); setPage(0); }} />
          </div>
        )}
      </section>

      {query.isLoading ? <LoadingSkeleton /> : query.isError ? (
        <EmptyState title={t("bookingModule.loadError")} description={toErrorMessage(query.error)} />
      ) : !items.length ? (
        <EmptyState title={t("bookingModule.empty")} description={t("bookingModule.emptyDescription")} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {items.map((booking) => (
            <button
              type="button"
              key={booking.id}
              onClick={() => setSelected(booking)}
              className="group rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/60 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">#{booking.id}</p>
                  <h2 className="mt-1 text-lg font-black group-hover:text-accent">{booking.ptServiceName ?? t("bookingModule.unnamedService")}</h2>
                </div>
                <Badge variant={statusVariant(booking.status)}>
                  {booking.status ? t(`bookingModule.statuses.${booking.status}`) : "—"}
                </Badge>
              </div>
              <div className="mt-5 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                <span className="flex items-center gap-2"><CalendarDays className="size-4 text-accent" />{dateText(booking.bookingDate, i18n.language)} · {timeText(booking.startTime)}</span>
                <span className="flex items-center gap-2"><UserRound className="size-4 text-primary" />{scope === "customer" ? booking.ptName : booking.customerName}</span>
                <span className="flex items-center gap-2"><MapPin className="size-4 text-blue-500" />{booking.branchName ?? booking.gymName}</span>
                <strong className="text-foreground">{money(booking.price, i18n.language)}</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      {(query.data?.totalPages ?? 0) > 1 && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((v) => v - 1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span>
          <Button variant="outline" size="icon-sm" disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}

      <BookingDetailDialog booking={selected} scope={scope} onClose={() => setSelected(null)} />
      <CreateBookingDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function BookingDetailDialog({ booking, scope, onClose }: { booking: Booking | null; scope: Scope; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const action = useBookingAction();
  const [confirming, setConfirming] = useState<{ action: BookingAction; message?: string } | null>(null);
  if (!booking) return null;

  const bookingId = booking.id;
  const actions: Array<{ action: BookingAction; label: string; message?: string }> = [];
  if (scope === "customer" && booking.status === "DRAFT") actions.push({ action: "submit", label: t("bookingModule.submit") });
  if (scope === "customer" && ["DRAFT", "PENDING", "CONFIRMED"].includes(booking.status ?? "")) actions.push({ action: "cancel", label: t("bookingModule.cancel") });
  if ((scope === "pt" || scope === "gym") && booking.status === "PENDING") actions.push({ action: "confirm", label: t("bookingModule.confirm") });
  if (scope === "pt" && booking.status === "CONFIRMED") {
    actions.push({ action: "checkIn", label: t("bookingModule.checkIn") });
    actions.push({ action: "noShow", label: t("bookingModule.noShow") });
    actions.push({ action: "cancel", label: t("bookingModule.cancel") });
  }
  if (scope === "pt" && booking.status === "CHECKED_IN") actions.push({ action: "complete", label: t("bookingModule.complete") });

  async function run() {
    if (!confirming || !bookingId) return;
    try {
      await action.mutateAsync({ id: bookingId, action: confirming.action, message: confirming.message });
      toast({ type: "success", title: t(`bookingModule.actionSuccess.${confirming.action}`) });
      setConfirming(null);
      onClose();
    } catch (error) {
      toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open title={t("bookingModule.detail")} onClose={onClose}>
      <div className="rounded-2xl bg-muted/50 p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">{booking.ptServiceName}</h3>
          <Badge variant={statusVariant(booking.status)}>
            {booking.status ? t(`bookingModule.statuses.${booking.status}`) : "—"}
          </Badge>
        </div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Info label={t("bookingModule.customer")} value={booking.customerName} />
          <Info label={t("bookingModule.trainer")} value={booking.ptName} />
          <Info label={t("bookingModule.location")} value={[booking.gymName, booking.branchName].filter(Boolean).join(" · ")} />
          <Info label={t("bookingModule.schedule")} value={`${dateText(booking.bookingDate, i18n.language)} · ${timeText(booking.startTime)}–${timeText(booking.endTime)}`} />
          <Info label={t("bookingModule.duration")} value={`${booking.durationMinutes ?? 0} ${t("bookingModule.minutes")}`} />
          <Info label={t("bookingModule.price")} value={money(booking.price, i18n.language)} />
        </dl>
        {booking.notes && (
          <p className="mt-4 rounded-xl border border-border bg-card p-3 text-sm">{booking.notes}</p>
        )}
      </div>

      {!!actions.length && (
        <div className="mt-5 flex flex-wrap gap-2">
          {actions.map((item) => (
            <Button
              key={item.action}
              variant={item.action === "cancel" || item.action === "noShow" ? "destructive" : "default"}
              onClick={() => setConfirming(item)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      )}

      {confirming && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="font-black">{t("bookingModule.confirmAction")}</p>
          {["cancel", "confirm"].includes(confirming.action) && (
            <Textarea
              className="mt-3"
              maxLength={500}
              placeholder={t("bookingModule.messageOptional")}
              value={confirming.message ?? ""}
              onChange={(e) => setConfirming({ ...confirming, message: e.target.value })}
            />
          )}
          <div className="mt-3 flex gap-2">
            <Button disabled={action.isPending} onClick={() => void run()}>{t("common.confirm")}</Button>
            <Button variant="outline" onClick={() => setConfirming(null)}>{t("common.cancel")}</Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-xs font-black uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold text-foreground">{value || "—"}</dd>
    </div>
  );
}

function CreateBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const create = useCreateBooking();
  const [ptUserId, setPtUserId] = useState(0);
  const [gymId, setGymId] = useState(0);
  const trainer = useGetPublicTrainer(ptUserId);
  const profileId = trainer.data?.id ?? 0;
  const services = useGetPublicTrainerServices(profileId);
  const gyms = useSearchGyms({ size: 50 });
  const branches = useGymBranches(gymId);
  const form = useForm<z.infer<typeof createBookingSchema>>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: { branchId: 0, ptServiceId: 0, bookingDate: new Date().toISOString().slice(0, 10), startTime: "08:00", notes: "" },
  });

  return (
    <Dialog open={open} title={t("bookingModule.create")} onClose={onClose}>
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await create.mutateAsync({ ...values, startTime: `${values.startTime}:00` });
            toast({ type: "success", title: t("bookingModule.createdDraft"), description: t("bookingModule.submitDraftHint") });
            form.reset();
            setPtUserId(0);
            setGymId(0);
            onClose();
          } catch (error) {
            toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) });
          }
        })}
      >
        <div className="sm:col-span-2">
          <FieldShell label={t("bookingModule.ptUserIdLabel")}>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={t("bookingModule.ptUserIdPlaceholder")}
                onChange={(e) => setPtUserId(Number(e.target.value) || 0)}
              />
              {trainer.isFetching && <span className="self-center text-xs text-muted-foreground">{t("common.loading")}</span>}
            </div>
          </FieldShell>
          {trainer.isError && <p className="mt-1 text-sm text-destructive">{t("bookingModule.ptNotFound")}</p>}
          {trainer.data && (
            <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm dark:border-emerald-900 dark:bg-emerald-950/30">
              <strong>{trainer.data.username}</strong> · {trainer.data.bio || t("trainerModule.emptyBio")}
            </div>
          )}
        </div>

        <FieldShell label={t("bookingModule.serviceLabel")} error={form.formState.errors.ptServiceId}>
          <Controller
            control={form.control}
            name="ptServiceId"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
                disabled={!services.data?.content?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={services.isFetching ? t("common.loading") : t("bookingModule.servicePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {services.data?.content?.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} · {new Intl.NumberFormat(i18n.language === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(s.price ?? 0)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        <FieldShell label={t("bookingModule.gymLabel")}>
          <Select
            value={String(gymId)}
            onValueChange={(v) => { setGymId(Number(v)); form.setValue("branchId", 0); }}
          >
            <SelectTrigger>
              <SelectValue placeholder={gyms.isFetching ? t("common.loading") : t("bookingModule.gymPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {gyms.data?.content?.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>{g.name} · {g.city}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>

        <FieldShell label={t("bookingModule.branchLabel")} error={form.formState.errors.branchId}>
          <Controller
            control={form.control}
            name="branchId"
            render={({ field }) => (
              <Select
                value={String(field.value)}
                onValueChange={(v) => field.onChange(Number(v))}
                disabled={!branches.data?.content?.length}
              >
                <SelectTrigger>
                  <SelectValue placeholder={branches.isFetching ? t("common.loading") : t("bookingModule.branchPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {branches.data?.content?.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name} · {b.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FieldShell>

        <FieldShell label={t("bookingModule.date")} error={form.formState.errors.bookingDate}>
          <Controller
            control={form.control}
            name="bookingDate"
            render={({ field }) => (
              <DatePicker value={field.value} onChange={field.onChange} />
            )}
          />
        </FieldShell>
        <FieldShell label={t("bookingModule.startTime")} error={form.formState.errors.startTime}>
          <Input type="time" {...form.register("startTime")} />
        </FieldShell>

        <div className="sm:col-span-2">
          <FieldShell label={t("bookingModule.notes")} error={form.formState.errors.notes}>
            <Textarea {...form.register("notes")} />
          </FieldShell>
        </div>

        <Button className="sm:col-span-2" disabled={create.isPending}>
          <CalendarCheck2 className="size-4" />
          {create.isPending ? t("common.loading") : t("bookingModule.saveDraft")}
        </Button>
      </form>
    </Dialog>
  );
}
