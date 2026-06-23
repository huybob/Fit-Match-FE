"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Activity, CalendarClock, Flame, MessageSquareText, Plus, Star, UserRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName } from "@/modules/forms/form-controls";
import type { TrainingSession } from "@/services/training-session.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useCreateTrainingSession, useSubmitSessionFeedback, useTrainingSessions, useUpdateTrainingSession } from "../hooks/use-training-session";
import { feedbackSchema, sessionSchema, updateSessionSchema } from "../schemas";

function when(value: string | undefined, language: string) {
  return value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
}
function duration(session: TrainingSession) {
  if (!session.actualStartTime || !session.actualEndTime) return undefined;
  return Math.max(0, Math.round((new Date(session.actualEndTime).getTime() - new Date(session.actualStartTime).getTime()) / 60000));
}

export function TrainingSessionsPage({ scope }: { scope: "customer" | "pt" }) {
  const { t, i18n } = useTranslation();
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<TrainingSession | null>(null);
  const [creating, setCreating] = useState(false);
  const query = useTrainingSessions(scope, page);
  const items = query.data?.content ?? [];
  return <div>
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-zinc-200/80 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:p-7"><div className="absolute -right-10 -top-16 size-40 rounded-full bg-orange-300/20 blur-3xl" /><div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 h-1 w-10 rounded-full bg-lime-500" /><h1 className="text-3xl font-black tracking-tight">{t(`sessionModule.${scope}Title`)}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">{t(`sessionModule.${scope}Description`)}</p></div>{scope === "pt" && <Button onClick={() => setCreating(true)}><Plus className="size-4" />{t("sessionModule.create")}</Button>}</div></section>
    {query.isLoading ? <LoadingSkeleton /> : query.isError ? <EmptyState title={t("sessionModule.loadError")} description={toErrorMessage(query.error)} /> : !items.length ? <EmptyState title={t("sessionModule.empty")} description={t("sessionModule.emptyDescription")} /> : <div className="grid gap-4 xl:grid-cols-2">{items.map((session) => <button key={session.id} type="button" onClick={() => setSelected(session)} className="group rounded-2xl border border-zinc-200/80 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-950"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-400">#{session.id}{session.bookingId ? ` · Booking #${session.bookingId}` : ""}</p><h2 className="mt-1 text-lg font-black group-hover:text-orange-600">{session.workoutPlanName ?? t("sessionModule.freeSession")}</h2></div>{session.rating ? <Badge className="border-amber-200 bg-amber-50 text-amber-700"><Star className="size-3 fill-current" />{session.rating}/5</Badge> : <Badge>{session.actualEndTime ? t("sessionModule.finished") : t("sessionModule.inProgress")}</Badge>}</div><div className="mt-5 grid gap-3 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-2"><span className="flex items-center gap-2"><UserRound className="size-4 text-lime-600" />{scope === "pt" ? session.customerName : session.ptName}</span><span className="flex items-center gap-2"><CalendarClock className="size-4 text-orange-500" />{when(session.actualStartTime, i18n.language)}</span><span className="flex items-center gap-2"><Activity className="size-4 text-blue-500" />{duration(session) !== undefined ? `${duration(session)} ${t("sessionModule.minutes")}` : t("sessionModule.notFinished")}</span><span className="flex items-center gap-2"><Flame className="size-4 text-red-500" />{session.caloriesBurned ?? 0} kcal</span></div></button>)}</div>}
    {(query.data?.totalPages ?? 0) > 1 && <div className="mt-6 flex items-center justify-end gap-3"><Button disabled={page === 0} onClick={() => setPage((v) => v - 1)}>{t("common.previous")}</Button><span className="text-sm font-bold">{page + 1} / {query.data?.totalPages}</span><Button disabled={query.data?.last} onClick={() => setPage((v) => v + 1)}>{t("common.next")}</Button></div>}
    <SessionDetailDialog session={selected} scope={scope} onClose={() => setSelected(null)} />
    <CreateSessionDialog open={creating} onClose={() => setCreating(false)} />
  </div>;
}

function SessionDetailDialog({ session, scope, onClose }: { session: TrainingSession | null; scope: "customer" | "pt"; onClose: () => void }) {
  const { t, i18n } = useTranslation(); const { toast } = useToast(); const update = useUpdateTrainingSession(); const feedback = useSubmitSessionFeedback();
  const updateForm = useForm<z.infer<typeof updateSessionSchema>>({ resolver: zodResolver(updateSessionSchema), values: { actualStartTime: session?.actualStartTime?.slice(0, 16) ?? "", actualEndTime: session?.actualEndTime?.slice(0, 16) ?? "", notes: session?.notes ?? "", caloriesBurned: session?.caloriesBurned } });
  const feedbackForm = useForm<z.infer<typeof feedbackSchema>>({ resolver: zodResolver(feedbackSchema), values: { feedback: session?.feedback ?? "", rating: session?.rating ?? 5 } });
  if (!session) return null;
  return <Dialog open title={t("sessionModule.detail")} onClose={onClose}><div className="rounded-2xl bg-zinc-50 p-5 dark:bg-zinc-900"><h3 className="text-xl font-black">{session.workoutPlanName ?? t("sessionModule.freeSession")}</h3><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2"><Info label={t("sessionModule.customer")} value={session.customerName} /><Info label={t("sessionModule.trainer")} value={session.ptName} /><Info label={t("sessionModule.startedAt")} value={when(session.actualStartTime, i18n.language)} /><Info label={t("sessionModule.endedAt")} value={when(session.actualEndTime, i18n.language)} /></dl></div>{scope === "pt" ? <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={updateForm.handleSubmit(async (values) => { if (!session.id) return; try { await update.mutateAsync({ id: session.id, payload: { actualStartTime: values.actualStartTime || undefined, actualEndTime: values.actualEndTime || undefined, notes: values.notes || undefined, caloriesBurned: values.caloriesBurned } }); toast({ type: "success", title: t("sessionModule.updated") }); onClose(); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } })}><FieldShell label={t("sessionModule.startedAt")}><input type="datetime-local" className={inputClassName} {...updateForm.register("actualStartTime")} /></FieldShell><FieldShell label={t("sessionModule.endedAt")}><input type="datetime-local" className={inputClassName} {...updateForm.register("actualEndTime")} /></FieldShell><FieldShell label={t("sessionModule.calories")}><input type="number" min={0} className={inputClassName} {...updateForm.register("caloriesBurned", { setValueAs: (value) => value === "" ? undefined : Number(value) })} /></FieldShell><div className="sm:col-span-2"><FieldShell label={t("sessionModule.notes")}><textarea className={cn(inputClassName, "min-h-24 py-3")} {...updateForm.register("notes")} /></FieldShell></div><Button className="sm:col-span-2" disabled={update.isPending}>{t("common.save")}</Button></form> : <form className="mt-5 space-y-4" onSubmit={feedbackForm.handleSubmit(async (values) => { if (!session.id) return; try { await feedback.mutateAsync({ id: session.id, payload: values }); toast({ type: "success", title: t("sessionModule.feedbackSent") }); onClose(); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } })}><FieldShell label={t("sessionModule.rating")}><select className={inputClassName} {...feedbackForm.register("rating", { valueAsNumber: true })}>{[5,4,3,2,1].map((v) => <option key={v} value={v}>{v}/5</option>)}</select></FieldShell><FieldShell label={t("sessionModule.feedback")}><textarea maxLength={1000} className={cn(inputClassName, "min-h-28 py-3")} {...feedbackForm.register("feedback")} /></FieldShell><Button disabled={feedback.isPending}><MessageSquareText className="size-4" />{t("sessionModule.sendFeedback")}</Button></form>}</Dialog>;
}

function CreateSessionDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation(); const { toast } = useToast(); const create = useCreateTrainingSession();
  const form = useForm<z.infer<typeof sessionSchema>>({ resolver: zodResolver(sessionSchema), defaultValues: { customerId: 0, workoutPlanId: undefined, actualStartTime: "", actualEndTime: "", notes: "" } });
  return <Dialog open={open} title={t("sessionModule.create")} onClose={onClose}><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async (values) => { try { await create.mutateAsync({ customerId: values.customerId, workoutPlanId: values.workoutPlanId, actualStartTime: values.actualStartTime || undefined, actualEndTime: values.actualEndTime || undefined, notes: values.notes || undefined }); toast({ type: "success", title: t("sessionModule.created") }); form.reset(); onClose(); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } })}><FieldShell label={t("sessionModule.customerId")} error={form.formState.errors.customerId}><input type="number" min={1} className={inputClassName} {...form.register("customerId", { valueAsNumber: true })} /></FieldShell><FieldShell label={t("sessionModule.workoutPlanId")} error={form.formState.errors.workoutPlanId}><input type="number" min={1} className={inputClassName} {...form.register("workoutPlanId", { setValueAs: (value) => value === "" ? undefined : Number(value) })} /></FieldShell><FieldShell label={t("sessionModule.startedAt")}><input type="datetime-local" className={inputClassName} {...form.register("actualStartTime")} /></FieldShell><FieldShell label={t("sessionModule.endedAt")}><input type="datetime-local" className={inputClassName} {...form.register("actualEndTime")} /></FieldShell><div className="sm:col-span-2"><FieldShell label={t("sessionModule.notes")}><textarea className={cn(inputClassName, "min-h-24 py-3")} {...form.register("notes")} /></FieldShell></div><Button className="sm:col-span-2" disabled={create.isPending}>{create.isPending ? t("common.loading") : t("sessionModule.create")}</Button></form></Dialog>;
}
function Info({ label, value }: { label: string; value?: string }) { return <div><dt className="text-xs font-black uppercase tracking-wide text-zinc-400">{label}</dt><dd className="mt-1 font-bold">{value || "—"}</dd></div>; }
