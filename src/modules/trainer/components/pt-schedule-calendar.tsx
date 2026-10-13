"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { ptScheduleService, type PtScheduleSource, type PtSlotStatus } from "@/services/pt-schedule.service";
import { Button } from "@/shared/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/select";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { toErrorMessage } from "@/shared/utils/error.util";
import { addDays, fromIsoDate, startOfWeek, todayIso } from "@/modules/ticket/calendar-date.util";
import { cn } from "@/shared/utils/cn.util";

const statuses: PtSlotStatus[] = ["FREE", "BUSY", "HELD", "LEAVE", "UNAVAILABLE"];
const colors: Record<PtSlotStatus, string> = {
  FREE: "border-success/30 bg-success-muted text-success", BUSY: "border-border bg-muted text-muted-foreground",
  HELD: "border-warning/30 bg-warning-muted text-warning", LEAVE: "border-destructive/20 bg-destructive/10 text-destructive",
  UNAVAILABLE: "border-border bg-muted/40 text-muted-foreground",
};
export function PtScheduleCalendar({ ptId, source = "public", compact = false }: {
  ptId: number; source?: PtScheduleSource; compact?: boolean;
}) {
  const t = useTranslations("ptSchedule");
  const locale = useLocale();
  const [anchor, setAnchor] = useState(() => startOfWeek(todayIso()));
  const [branchId, setBranchId] = useState<number>();
  const to = addDays(anchor, 6);
  const query = useQuery({
    queryKey: ["pt-schedule", source, ptId, branchId, anchor, to],
    queryFn: () => ptScheduleService.get(source, ptId, anchor, to, branchId),
    enabled: ptId > 0, staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30000,
  });
  const data = query.data;
  const formatDate = (date: string) => new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", { weekday: "short", day: "2-digit", month: "2-digit" }).format(fromIsoDate(date));
  return <section className="space-y-3 rounded-2xl border border-border bg-card p-4" aria-label={t("title")}>
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">{t("title")}</h2>
      <span className="text-xs text-muted-foreground">{t("timezone")}</span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {data?.branches.length ? <Select value={String(data.branchId ?? "")} onValueChange={value => setBranchId(Number(value))}>
        <SelectTrigger className="w-full sm:w-52" aria-label={t("branch")}><SelectValue /></SelectTrigger>
        <SelectContent>{data.branches.map(branch => <SelectItem key={branch.id} value={String(branch.id)}>{branch.name}</SelectItem>)}</SelectContent>
      </Select> : null}
      <Button variant="outline" size="sm" aria-label={t("previous")} onClick={() => setAnchor(addDays(anchor, -7))}><ChevronLeft className="size-4" /></Button>
      <Button variant="outline" size="sm" onClick={() => setAnchor(startOfWeek(todayIso()))}>{t("today")}</Button>
      <Button variant="outline" size="sm" aria-label={t("next")} onClick={() => setAnchor(addDays(anchor, 7))}><ChevronRight className="size-4" /></Button>
      <Button variant="ghost" size="sm" disabled={query.isFetching} onClick={() => query.refetch()} aria-label={t("refresh")}><RefreshCw className="size-4" /></Button>
      <span className="text-xs text-muted-foreground">{formatDate(anchor)} – {formatDate(to)}</span>
    </div>
    <div className="flex flex-wrap gap-2 text-xs">{statuses.map(status =>
      <span key={status} className={cn("rounded-md border px-2 py-1", colors[status])}>{t(status)}</span>)}</div>
    {query.isLoading ? <LoadingSkeleton /> : query.isError ? <div role="alert" className="text-sm text-destructive">
      <p>{toErrorMessage(query.error)}</p><Button variant="outline" size="sm" onClick={() => query.refetch()}>{t("retry")}</Button>
    </div> : !data?.branches.length ? <p className="text-sm text-muted-foreground">{t("noBranch")}</p> :
      <div className={cn("grid gap-3", compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-7")}>
        {data.days.map(day => <article key={day.date} className="min-w-0 space-y-2 rounded-xl border border-border p-2.5">
          <h3 className="text-sm font-semibold">{formatDate(day.date)}</h3>
          <p className="text-xs text-muted-foreground">{day.workingHours.length
            ? t("work", { hours: day.workingHours.map(w => `${w.start.slice(0, 5)}–${w.end.slice(0, 5)}`).join(", ") })
            : day.status === "LEAVE" ? t("dayOff") : t("noSchedule")}</p>
          {day.slots.map(slot => <div key={`${slot.start}-${slot.end}`} className={cn("rounded-md border p-1.5 text-xs", colors[slot.status])}>
            <p className="font-medium">{slot.start.slice(0, 5)}–{slot.end.slice(0, 5)}</p><p>{t(slot.status)}</p>
          </div>)}
          {day.workingHours.length > 0 ? <p className="text-[11px] text-muted-foreground">{t("outside")}</p> : null}
        </article>)}
      </div>}
    {data ? <p className="text-xs text-muted-foreground">{t("updated", { time: data.updatedAt.slice(11, 19) })}</p> : null}
  </section>;
}
