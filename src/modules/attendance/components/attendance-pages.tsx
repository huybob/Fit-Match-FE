"use client";
import { CalendarCheck2, CheckCircle2, Clock3, UserRound, XCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAttendance } from "../hooks/use-attendance";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { toErrorMessage } from "@/shared/utils/error.util";

function dateTime(value: string | undefined, language: string) { return value ? new Intl.DateTimeFormat(language === "vi" ? "vi-VN" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
export function AttendancePage({ scope }: { scope: "customer" | "pt" }) {
  const { t, i18n } = useTranslation(); const [page, setPage] = useState(0); const query = useAttendance(scope, page); const items = query.data?.content ?? [];
  const stats = { onTime: items.filter((x)=>x.status === "ON_TIME").length, late: items.filter((x)=>x.status === "LATE").length, absent: items.filter((x)=>x.status === "ABSENT").length };
  return <div><section className="mb-6 rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/80"><div className="mb-3 h-1 w-10 rounded-full bg-lime-500"/><h1 className="text-3xl font-black">{t(`attendance.${scope}Title`)}</h1><p className="mt-2 text-sm text-zinc-500">{t(`attendance.${scope}Description`)}</p></section>
    {!!items.length && <div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={CheckCircle2} label={t("attendance.statuses.ON_TIME")} value={stats.onTime}/><Stat icon={Clock3} label={t("attendance.statuses.LATE")} value={stats.late}/><Stat icon={XCircle} label={t("attendance.statuses.ABSENT")} value={stats.absent}/></div>}
    {query.isLoading ? <LoadingSkeleton/> : query.isError ? <EmptyState title={t("attendance.loadError")} description={toErrorMessage(query.error)}/> : !items.length ? <EmptyState title={t("attendance.empty")} description={t("attendance.emptyDescription")}/> : <div className="grid gap-4 lg:grid-cols-2">{items.map((item)=><article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950"><div className="flex justify-between gap-3"><p className="text-xs font-black uppercase tracking-wider text-zinc-400">Session #{item.trainingSessionId}</p><Badge>{item.status ? t(`attendance.statuses.${item.status}`) : "—"}</Badge></div><h2 className="mt-2 flex items-center gap-2 text-lg font-black"><UserRound className="size-4 text-orange-500"/>{item.customerName ?? t("attendance.me")}</h2><div className="mt-4 grid gap-2 text-sm text-zinc-500"><span>{t("attendance.checkIn")}: {dateTime(item.checkInTime, i18n.language)}</span><span>{t("attendance.checkOut")}: {dateTime(item.checkOutTime, i18n.language)}</span></div>{item.sessionNotes && <p className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-900">{item.sessionNotes}</p>}</article>)}</div>}
    {(query.data?.totalPages ?? 0) > 1 && <div className="mt-6 flex justify-end gap-2"><Button disabled={page===0} onClick={()=>setPage(v=>v-1)}>{t("common.previous")}</Button><Button disabled={query.data?.last} onClick={()=>setPage(v=>v+1)}>{t("common.next")}</Button></div>}</div>;
}
function Stat({ icon: Icon, label, value }: { icon: typeof CalendarCheck2; label: string; value: number }) { return <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"><Icon className="size-5 text-orange-500"/><div><p className="text-2xl font-black">{value}</p><p className="text-xs font-bold text-zinc-500">{label}</p></div></div>; }
