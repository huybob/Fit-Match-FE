"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarCheck2, CalendarDays, ChevronLeft, ChevronRight, MapPin, Plus, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName, selectClassName } from "@/modules/forms/form-controls";
import { Booking, BookingStatus } from "@/services/booking.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
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
function statusTone(status?: BookingStatus) {
  if (status === "COMPLETED") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "CANCELLED" || status === "NO_SHOW") return "border-red-200 bg-red-50 text-red-700";
  if (status === "CONFIRMED" || status === "CHECKED_IN") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "PENDING") return "border-orange-200 bg-orange-50 text-orange-700";
  return "";
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
      <section className="relative mb-6 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-7">
        <div className="absolute -right-10 -top-16 size-40 rounded-full bg-lime-300/25 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-3 h-1 w-10 rounded-full bg-orange-500" /><h1 className="text-3xl font-black tracking-tight">{t(`bookingModule.${scope}Title`)}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t(`bookingModule.${scope}Description`)}</p></div>
          {scope === "customer" && <Button onClick={() => setCreating(true)}><Plus className="size-4" />{t("bookingModule.create")}</Button>}
        </div>
      </section>

      <section className="mb-5 grid gap-3 rounded-2xl border border-zinc-200/80 bg-white/80 p-4 dark:border-zinc-800 dark:bg-zinc-950/80 sm:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-wide text-zinc-500">{t("bookingModule.status")}<select className={cn(selectClassName, "mt-2 font-semibold normal-case")} value={status} onChange={(e) => { setStatus(e.target.value as BookingStatus | ""); setPage(0); }}><option value="">{t("bookingModule.allStatuses")}</option>{statuses.map((item) => <option key={item} value={item}>{t(`bookingModule.statuses.${item}`)}</option>)}</select></label>
        {scope !== "customer" && <label className="text-xs font-black uppercase tracking-wide text-zinc-500">{t("bookingModule.date")}<input className={cn(inputClassName, "mt-2 font-semibold normal-case")} type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(0); }} /></label>}
      </section>

      {query.isLoading ? <LoadingSkeleton /> : query.isError ? <EmptyState title={t("bookingModule.loadError")} description={toErrorMessage(query.error)} /> : !items.length ? <EmptyState title={t("bookingModule.empty")} description={t("bookingModule.emptyDescription")} /> : (
        <div className="grid gap-4 xl:grid-cols-2">{items.map((booking) => <button type="button" key={booking.id} onClick={() => setSelected(booking)} className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-lime-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">#{booking.id}</p><h2 className="mt-1 text-lg font-black group-hover:text-orange-600">{booking.ptServiceName ?? t("bookingModule.unnamedService")}</h2></div><Badge className={statusTone(booking.status)}>{booking.status ? t(`bookingModule.statuses.${booking.status}`) : "—"}</Badge></div>
          <div className="mt-5 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2"><span className="flex items-center gap-2"><CalendarDays className="size-4 text-orange-500" />{dateText(booking.bookingDate, i18n.language)} · {timeText(booking.startTime)}</span><span className="flex items-center gap-2"><UserRound className="size-4 text-lime-600" />{scope === "customer" ? booking.ptName : booking.customerName}</span><span className="flex items-center gap-2"><MapPin className="size-4 text-blue-500" />{booking.branchName ?? booking.gymName}</span><strong className="text-zinc-950 dark:text-white">{money(booking.price, i18n.language)}</strong></div>
        </button>)}</div>
      )}
      {(query.data?.totalPages ?? 0) > 1 && <div className="mt-6 flex items-center justify-end gap-3"><Button className="bg-white text-zinc-900 ring-1 ring-zinc-200" disabled={page === 0} onClick={() => setPage((v) => v - 1)}><ChevronLeft className="size-4" /></Button><span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span><Button className="bg-white text-zinc-900 ring-1 ring-zinc-200" disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}><ChevronRight className="size-4" /></Button></div>}
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
  if (scope === "pt" && booking.status === "CONFIRMED") { actions.push({ action: "checkIn", label: t("bookingModule.checkIn") }); actions.push({ action: "noShow", label: t("bookingModule.noShow") }); actions.push({ action: "cancel", label: t("bookingModule.cancel") }); }
  if (scope === "pt" && booking.status === "CHECKED_IN") actions.push({ action: "complete", label: t("bookingModule.complete") });
  async function run() { if (!confirming || !bookingId) return; try { await action.mutateAsync({ id: bookingId, action: confirming.action, message: confirming.message }); toast({ type: "success", title: t(`bookingModule.actionSuccess.${confirming.action}`) }); setConfirming(null); onClose(); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } }
  return <Dialog open title={t("bookingModule.detail")} onClose={onClose}>
    <div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900"><div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">{booking.ptServiceName}</h3><Badge className={statusTone(booking.status)}>{booking.status ? t(`bookingModule.statuses.${booking.status}`) : "—"}</Badge></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info label={t("bookingModule.customer")} value={booking.customerName} /><Info label={t("bookingModule.trainer")} value={booking.ptName} /><Info label={t("bookingModule.location")} value={[booking.gymName, booking.branchName].filter(Boolean).join(" · ")} /><Info label={t("bookingModule.schedule")} value={`${dateText(booking.bookingDate, i18n.language)} · ${timeText(booking.startTime)}–${timeText(booking.endTime)}`} /><Info label={t("bookingModule.duration")} value={`${booking.durationMinutes ?? 0} ${t("bookingModule.minutes")}`} /><Info label={t("bookingModule.price")} value={money(booking.price, i18n.language)} /></dl>{booking.notes && <p className="mt-4 rounded-xl border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">{booking.notes}</p>}</div>
    {!!actions.length && <div className="mt-5 flex flex-wrap gap-2">{actions.map((item) => <Button key={item.action} className={item.action === "cancel" || item.action === "noShow" ? "bg-red-600 text-white hover:bg-red-700" : ""} onClick={() => setConfirming(item)}>{item.label}</Button>)}</div>}
    {confirming && <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30"><p className="font-black">{t("bookingModule.confirmAction")}</p>{["cancel", "confirm"].includes(confirming.action) && <textarea className={cn(inputClassName, "mt-3 min-h-20 py-3")} maxLength={500} placeholder={t("bookingModule.messageOptional")} value={confirming.message ?? ""} onChange={(e) => setConfirming({ ...confirming, message: e.target.value })} />}<div className="mt-3 flex gap-2"><Button disabled={action.isPending} onClick={() => void run()}>{t("common.confirm")}</Button><Button className="bg-white text-zinc-900 ring-1 ring-zinc-200" onClick={() => setConfirming(null)}>{t("common.cancel")}</Button></div></div>}
  </Dialog>;
}

function Info({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs font-black uppercase tracking-wide text-zinc-400">{label}</dt><dd className="mt-1 font-bold text-zinc-800 dark:text-zinc-100">{value || "—"}</dd></div>; }

function CreateBookingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation(); const { toast } = useToast(); const create = useCreateBooking();
  const form = useForm<z.infer<typeof createBookingSchema>>({ resolver: zodResolver(createBookingSchema), defaultValues: { branchId: 0, ptServiceId: 0, bookingDate: new Date().toISOString().slice(0, 10), startTime: "08:00", notes: "" } });
  return <Dialog open={open} title={t("bookingModule.create")} onClose={onClose}><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async (values) => { try { await create.mutateAsync({ ...values, startTime: `${values.startTime}:00` }); toast({ type: "success", title: t("bookingModule.createdDraft"), description: t("bookingModule.submitDraftHint") }); form.reset(); onClose(); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } })}><FieldShell label={t("bookingModule.branchId")} error={form.formState.errors.branchId}><input type="number" min={1} className={inputClassName} {...form.register("branchId", { valueAsNumber: true })} /></FieldShell><FieldShell label={t("bookingModule.serviceId")} error={form.formState.errors.ptServiceId}><input type="number" min={1} className={inputClassName} {...form.register("ptServiceId", { valueAsNumber: true })} /></FieldShell><FieldShell label={t("bookingModule.date")} error={form.formState.errors.bookingDate}><input type="date" className={inputClassName} {...form.register("bookingDate")} /></FieldShell><FieldShell label={t("bookingModule.startTime")} error={form.formState.errors.startTime}><input type="time" className={inputClassName} {...form.register("startTime")} /></FieldShell><div className="sm:col-span-2"><FieldShell label={t("bookingModule.notes")} error={form.formState.errors.notes}><textarea className={cn(inputClassName, "min-h-24 py-3")} {...form.register("notes")} /></FieldShell></div><div className="sm:col-span-2 rounded-xl bg-blue-50 p-3 text-xs leading-5 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">{t("bookingModule.idHint")}</div><Button className="sm:col-span-2" disabled={create.isPending}><CalendarCheck2 className="size-4" />{create.isPending ? t("common.loading") : t("bookingModule.saveDraft")}</Button></form></Dialog>;
}
