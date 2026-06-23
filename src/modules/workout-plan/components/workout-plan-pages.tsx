"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClipboardList, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { FieldShell, inputClassName, selectClassName } from "@/modules/forms/form-controls";
import type { WorkoutPlan, WorkoutPlanStatus } from "@/services/workout-plan.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useSaveWorkoutPlan, useWorkoutPlanAction, useWorkoutPlans } from "../hooks/use-workout-plan";
import { workoutPlanSchema } from "../schemas";

const statuses: WorkoutPlanStatus[] = ["ACTIVE", "COMPLETED", "ARCHIVED"];
export function WorkoutPlansPage({ scope }: { scope: "customer" | "pt" }) {
  const { t } = useTranslation(); const [status, setStatus] = useState<WorkoutPlanStatus | "">(""); const [editing, setEditing] = useState<WorkoutPlan | null | undefined>();
  const query = useWorkoutPlans(scope, status || undefined); const action = useWorkoutPlanAction(); const { toast } = useToast();
  async function run(id: number, next: "complete" | "archive") { try { await action.mutateAsync({ id, action: next }); toast({ type: "success", title: t(`workoutPlan.actionSuccess.${next}`) }); } catch (error) { toast({ type: "error", title: t("common.requestFailed"), description: toErrorMessage(error) }); } }
  return <div><section className="mb-6 flex flex-col gap-5 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80 sm:flex-row sm:items-end sm:justify-between"><div><div className="mb-3 h-1 w-10 rounded-full bg-orange-500"/><h1 className="text-3xl font-black">{t(`workoutPlan.${scope}Title`)}</h1><p className="mt-2 text-sm text-zinc-500">{t(`workoutPlan.${scope}Description`)}</p></div>{scope === "pt" && <Button onClick={() => setEditing(null)}><Plus className="size-4"/>{t("workoutPlan.create")}</Button>}</section>
    <select className={selectClassName} value={status} onChange={(e) => setStatus(e.target.value as WorkoutPlanStatus | "")}><option value="">{t("workoutPlan.allStatuses")}</option>{statuses.map((s)=><option key={s} value={s}>{t(`workoutPlan.statuses.${s}`)}</option>)}</select>
    <div className="mt-5">{query.isLoading ? <LoadingSkeleton/> : query.isError ? <EmptyState title={t("workoutPlan.loadError")} description={toErrorMessage(query.error)}/> : !query.data?.content?.length ? <EmptyState title={t("workoutPlan.empty")} description={t("workoutPlan.emptyDescription")}/> : <div className="grid gap-4 lg:grid-cols-2">{query.data.content.map((plan)=><article key={plan.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="flex justify-between gap-3"><div><p className="text-xs font-black uppercase text-zinc-400">{scope === "pt" ? plan.customerName : plan.ptName}</p><h2 className="mt-1 text-xl font-black">{plan.name}</h2></div><Badge>{plan.status ? t(`workoutPlan.statuses.${plan.status}`) : "—"}</Badge></div><p className="mt-3 text-sm text-zinc-500">{plan.description || t("common.noDescription")}</p><p className="mt-4 text-sm font-bold">{plan.startDate} → {plan.endDate} · {plan.exercises?.length ?? 0} {t("workoutPlan.exercises")}</p>{scope === "pt" && <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setEditing(plan)}>{t("common.edit")}</Button>{plan.status === "ACTIVE" && <><Button onClick={() => void run(plan.id!, "complete")}>{t("workoutPlan.complete")}</Button><Button className="bg-zinc-600" onClick={() => void run(plan.id!, "archive")}>{t("workoutPlan.archive")}</Button></>}</div>}</article>)}</div>}</div>
    {editing !== undefined && <WorkoutPlanDialog plan={editing} onClose={() => setEditing(undefined)}/>}</div>;
}

function WorkoutPlanDialog({ plan, onClose }: { plan: WorkoutPlan | null; onClose: () => void }) {
  const { t } = useTranslation(); const save = useSaveWorkoutPlan(); const { toast } = useToast();
  const form = useForm<z.infer<typeof workoutPlanSchema>>({ resolver: zodResolver(workoutPlanSchema), defaultValues: { customerId: plan?.customerId ?? 0, name: plan?.name ?? "", description: plan?.description ?? "", startDate: plan?.startDate ?? "", endDate: plan?.endDate ?? "", exercises: plan?.exercises?.length ? plan.exercises.map((e)=>({ ...e })) : [{ name: "", sets: 1, reps: 1, weight: "", notes: "" }] } });
  return <Dialog open title={plan ? t("workoutPlan.edit") : t("workoutPlan.create")} onClose={onClose}><form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(async(values)=>{try{await save.mutateAsync({id:plan?.id,payload:values});toast({type:"success",title:t("workoutPlan.saved")});onClose();}catch(error){toast({type:"error",title:t("common.requestFailed"),description:toErrorMessage(error)});}})}><FieldShell label={t("workoutPlan.customerId")} error={form.formState.errors.customerId}><input className={inputClassName} type="number" {...form.register("customerId",{valueAsNumber:true})}/></FieldShell><FieldShell label={t("workoutPlan.name")} error={form.formState.errors.name}><input className={inputClassName} {...form.register("name")}/></FieldShell><FieldShell label={t("workoutPlan.startDate")}><input className={inputClassName} type="date" {...form.register("startDate")}/></FieldShell><FieldShell label={t("workoutPlan.endDate")} error={form.formState.errors.endDate}><input className={inputClassName} type="date" {...form.register("endDate")}/></FieldShell><div className="sm:col-span-2"><FieldShell label={t("common.description")}><textarea className={inputClassName} {...form.register("description")}/></FieldShell></div><div className="sm:col-span-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"><p className="mb-3 font-black">{t("workoutPlan.firstExercise")}</p><div className="grid gap-3 sm:grid-cols-3"><input className={inputClassName} placeholder={t("workoutPlan.exerciseName")} {...form.register("exercises.0.name")}/><input className={inputClassName} type="number" placeholder={t("workoutPlan.sets")} {...form.register("exercises.0.sets",{valueAsNumber:true})}/><input className={inputClassName} type="number" placeholder={t("workoutPlan.reps")} {...form.register("exercises.0.reps",{valueAsNumber:true})}/></div></div><Button className="sm:col-span-2" disabled={save.isPending}><ClipboardList className="size-4"/>{t("common.save")}</Button></form></Dialog>;
}
