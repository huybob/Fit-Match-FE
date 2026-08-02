"use client";

// Gói 2.D (audit 2026-07-17): dialog vận hành PT cho gym — 4 mảng BE đã đủ nhưng FE = 0:
// B-27 lịch rảnh (UC-028), B-16 phân công (UC-022), B-17 hiệu suất (UC-023), B-29 chặn giờ (UC-029).

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { GymPtResponse } from "@/types/Gym";
import type { AvailabilitySlot, PtAssignmentInput } from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { DateTimePicker } from "@/shared/components/ui/date-time-picker";
import { TimePicker } from "@/shared/components/ui/time-picker";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";
import { WEEKDAY_ORDER, weekdayKey } from "@/shared/utils/enum-label.util";
import { useFormatters } from "@/i18n/use-formatters";


type Tab = "availability" | "assignments" | "performance" | "blocked";

/* Chỉ giữ khoá i18n — nhãn resolve trong component. */
const TABS = [
  { key: "availability", labelKey: "gym.ptOps.tabAvailability" },
  { key: "assignments", labelKey: "gym.ptOps.tabAssignments" },
  { key: "performance", labelKey: "gym.ptOps.tabPerformance" },
  { key: "blocked", labelKey: "gym.ptOps.tabBlocked" },
] as const satisfies ReadonlyArray<{ key: Tab; labelKey: string }>;

export function PtOpsDialog({ pt, onClose }: { pt: GymPtResponse; onClose: () => void }) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("availability");
  const ptId = pt.id!;

  return (
    <Dialog open title={t("gym.ptOps.dialogTitle", { name: pt.displayName ?? pt.username ?? "" })} onClose={onClose}>
      <div className="mb-4 flex gap-1 border-b border-border">
        {TABS.map((tabItem) => (
          <button
            key={tabItem.key}
            onClick={() => setTab(tabItem.key)}
            className={`cursor-pointer px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              tab === tabItem.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(tabItem.labelKey)}
          </button>
        ))}
      </div>
      {tab === "availability" && <AvailabilityTab ptId={ptId} />}
      {tab === "assignments" && <AssignmentsTab ptId={ptId} />}
      {tab === "performance" && <PerformanceTab ptId={ptId} />}
      {tab === "blocked" && <BlockedTab ptId={ptId} />}
    </Dialog>
  );
}

/** UC-028 (B-27): editor lịch rảnh tuần của PT — dayOfWeek 1-7, PUT replace-all. */
function AvailabilityTab({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["gym-pt", ptId, "availability"],
    queryFn: () => gymService.getPtAvailability(ptId),
  });
  const [rows, setRows] = useState<Array<AvailabilitySlot & { key: number }>>([]);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!query.data) return;
    setRows(query.data.map((s, i) => ({
      key: i,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime?.slice(0, 5) ?? "",
      endTime: s.endTime?.slice(0, 5) ?? "",
    })));
    setDirty(false);
  }, [query.data]);

  const save = useMutation({
    mutationFn: () =>
      gymService.updatePtAvailability(ptId,
        rows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "availability"] });
      toast({ type: "success", title: t("gym.ptOps.availabilitySaved") });
    },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  const invalid = rows.some((r) => !r.startTime || !r.endTime || r.startTime >= r.endTime);

  /**
   * Bug S2-16: nhân khung giờ của một dòng ra các ngày còn lại. Bỏ qua ngày đã có
   * đúng khung giờ đó để không tạo slot trùng (BE từ chối overlap trong cùng ngày).
   */
  function copyRowToOtherDays(key: number) {
    const source = rows.find((r) => r.key === key);
    if (!source?.startTime || !source.endTime) return;
    setRows((prev) => {
      const added = WEEKDAY_ORDER.filter(
        (d) =>
          d !== source.dayOfWeek
          && !prev.some((r) => r.dayOfWeek === d && r.startTime === source.startTime && r.endTime === source.endTime),
      ).map((d, i) => ({
        key: Date.now() + i,
        dayOfWeek: d,
        startTime: source.startTime,
        endTime: source.endTime,
      }));
      return [...prev, ...added];
    });
    setDirty(true);
    toast({ type: "success", title: t("common.datetime.copiedToOtherDays") });
  }

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-destructive">{toErrorMessage(query.error)}</p>;

  return (
    <div className="space-y-2">
      {rows.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("gym.ptOps.noSlots")}</p>
      )}
      {rows.map((r) => (
        <div key={r.key} className="flex items-center gap-2">
          <Select
            value={String(r.dayOfWeek)}
            onValueChange={(v) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, dayOfWeek: Number(v) } : x)); setDirty(true); }}
          >
            <SelectTrigger className="h-9 w-24 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {WEEKDAY_ORDER.map((d) => (
                <SelectItem key={d} value={String(d)}>{t(weekdayKey(d))}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TimePicker value={r.startTime} className="h-9 w-26 text-sm"
            onChange={(v) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, startTime: v ?? "" } : x)); setDirty(true); }} />
          <span className="text-xs text-muted-foreground">→</span>
          <TimePicker value={r.endTime} className="h-9 w-26 text-sm"
            onChange={(v) => { setRows((p) => p.map((x) => x.key === r.key ? { ...x, endTime: v ?? "" } : x)); setDirty(true); }} />
          {/* Bug S2-16: đặt 1 ngày rồi nhân ra các ngày còn lại. */}
          <IconButton
            tooltip={t("common.datetime.copyToOtherDays")}
            disabled={!r.startTime || !r.endTime}
            onClick={() => copyRowToOtherDays(r.key)}
            className="text-muted-foreground hover:text-primary"
          >
            <CopyPlus className="size-4" />
          </IconButton>
          <IconButton
            tooltip={t("gym.ptOps.deleteSlot")}
            onClick={() => { setRows((p) => p.filter((x) => x.key !== r.key)); setDirty(true); }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </IconButton>
        </div>
      ))}
      {invalid && <p className="text-xs text-destructive">{t("gym.ptOps.slotInvalid")}</p>}
      <div className="flex justify-between pt-2">
        <Button
          onClick={() => { setRows((p) => [...p, { key: Date.now(), dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }]); setDirty(true); }}
          className="h-8 gap-1.5 px-3 text-xs bg-card border border-border text-muted-foreground hover:bg-muted/40 shadow-none"
        >
          <Plus className="size-3.5" /> {t("common.actions.addTimeSlot")}
        </Button>
        <Button onClick={() => save.mutate()} disabled={!dirty || invalid || save.isPending}
          className="h-8 gap-2 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
          {save.isPending && <Loader2 className="size-3.5 animate-spin" />} {t("common.actions.save")}
        </Button>
      </div>
    </div>
  );
}

/** UC-022 (B-16): phân công PT — đúng-một-trong branch/service/package. */
function AssignmentsTab({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [targetType, setTargetType] = useState<"branch" | "service" | "package">("branch");
  const [targetId, setTargetId] = useState("");

  const assignments = useQuery({
    queryKey: ["gym-pt", ptId, "assignments"],
    queryFn: () => gymService.listPtAssignments(ptId),
  });
  const branches = useQuery({ queryKey: ["gym-branches"], queryFn: gymService.listOwnBranches });
  const services = useQuery({ queryKey: ["gym-services"], queryFn: gymService.listOwnServices });
  const packages = useQuery({ queryKey: ["gym-packages"], queryFn: gymService.listOwnPackages });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "assignments"] });

  const add = useMutation({
    mutationFn: () => {
      const payload: PtAssignmentInput = {};
      if (targetType === "branch") payload.branchId = Number(targetId);
      if (targetType === "service") payload.serviceId = Number(targetId);
      if (targetType === "package") payload.packageId = Number(targetId);
      return gymService.addPtAssignment(ptId, payload);
    },
    onSuccess: () => { invalidate(); setTargetId(""); toast({ type: "success", title: "Đã phân công PT" }); },
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.assignFailed"), description: toErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (assignmentId: number) => gymService.removePtAssignment(ptId, assignmentId),
    onSuccess: () => { invalidate(); toast({ type: "success", title: t("gym.ptOps.assignRemoved") }); },
    // BE chặn gỡ khi PT còn booking tương lai (P1-16) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.removeFailed"), description: toErrorMessage(e) }),
  });

  const options =
    targetType === "branch" ? (branches.data ?? []).map((b) => ({ id: b.id, name: b.name }))
      : targetType === "service" ? (services.data ?? []).map((s) => ({ id: s.id, name: s.name }))
        : (packages.data ?? []).map((p) => ({ id: p.id, name: p.name }));

  if (assignments.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (assignments.isError) return <p className="text-sm text-destructive">{toErrorMessage(assignments.error)}</p>;

  return (
    <div className="space-y-3">
      {!(assignments.data ?? []).length ? (
        <p className="text-sm text-muted-foreground">{t("gym.ptOps.noAssignments")}</p>
      ) : (
        <ul className="space-y-2">
          {(assignments.data ?? []).map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <span className="text-foreground">
                {a.branchName
                  ? t("gym.ptOps.branchPrefix", { name: a.branchName })
                  : a.serviceName
                    ? t("gym.ptOps.servicePrefix", { name: a.serviceName })
                    : t("gym.ptOps.packagePrefix", { name: a.packageName ?? "" })}
              </span>
              <IconButton
                tooltip={t("gym.ptOps.removeAssignment")}
                onClick={() => a.id != null && remove.mutate(a.id)}
                disabled={remove.isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">{t("gym.ptOps.addAssignment")}</p>
        <div className="flex gap-2">
          <Select
            value={targetType}
            onValueChange={(v) => { setTargetType(v as typeof targetType); setTargetId(""); }}
          >
            <SelectTrigger className="h-9 w-32 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="branch">{t("gym.nav.branches")}</SelectItem>
              <SelectItem value="service">{t("gym.services.title")}</SelectItem>
              <SelectItem value="package">{t("gym.packages.title")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger className="h-9 flex-1 text-sm">
              <SelectValue placeholder={t("gym.ptOps.selectPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => add.mutate()} disabled={!targetId || add.isPending}
            className="h-9 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
            {add.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} {t("common.actions.add")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** UC-023 (B-17): hiệu suất PT. */
function PerformanceTab({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const query = useQuery({
    queryKey: ["gym-pt", ptId, "performance"],
    queryFn: () => gymService.getPtPerformance(ptId),
  });

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-destructive">{toErrorMessage(query.error)}</p>;

  const p = query.data;
  const stats = [
    { label: t("gym.ptOps.rating"), value: p?.averageRating != null ? `${Number(p.averageRating).toFixed(1)} ★ (${p.reviewCount ?? 0})` : t("common.states.none") },
    { label: t("gym.ptOps.completedSessions"), value: String(p?.completedBookings ?? 0) },
    { label: t("gym.ptOps.cancelledSessions"), value: String(p?.cancelledBookings ?? 0) },
    { label: t("gym.ptOps.noShows"), value: String(p?.noShowBookings ?? 0) },
    { label: t("gym.ptOps.disputes"), value: String(p?.disputes ?? 0) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</p>
          <p className="mt-1 text-lg font-bold text-foreground">{s.value}</p>
        </div>
      ))}
    </div>
  );
}

/** UC-029 (B-29): thời gian chặn của PT do gym quản lý. */
function BlockedTab({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["gym-pt", ptId, "blocked"],
    queryFn: () => gymService.listBlockedTimes({ ptId }),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "blocked"] });

  const create = useMutation({
    mutationFn: () => gymService.createBlockedTime({ ptId, startAt: start + ":00", endAt: end + ":00", reason: reason.trim() || undefined }),
    onSuccess: () => { invalidate(); setStart(""); setEnd(""); setReason(""); toast({ type: "success", title: "Đã thêm khoảng chặn" }); },
    // BE chặn tạo blocked time đè booking HOLDING (P1-15).
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.addFailed"), description: toErrorMessage(e) }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => gymService.deleteBlockedTime(id),
    onSuccess: () => { invalidate(); toast({ type: "success", title: t("gym.ptOps.blockedDeleted") }); },
    onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
  });

  if (query.isLoading) return <div className="flex justify-center py-8"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  if (query.isError) return <p className="text-sm text-destructive">{toErrorMessage(query.error)}</p>;

  return (
    <div className="space-y-3">
      {!(query.data ?? []).length ? (
        <p className="text-sm text-muted-foreground">{t("gym.ptOps.noBlocked")}</p>
      ) : (
        <ul className="space-y-2">
          {(query.data ?? []).map((b) => (
            <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-foreground">
                  {fmt.dateTime(b.startAt)} → {fmt.dateTime(b.endAt)}
                </p>
                {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
              </div>
              <IconButton tooltip={t("gym.ptOps.deleteBlocked")} onClick={() => b.id != null && remove.mutate(b.id)} disabled={remove.isPending}
                className="shrink-0 text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <DateTimePicker value={start} onChange={(v) => setStart(v ?? "")} className="text-sm" />
          <DateTimePicker value={end} onChange={(v) => setEnd(v ?? "")} className="text-sm" />
        </div>
        <Input value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} placeholder={t("gym.ptOps.reasonOptional")} className="text-sm" />
        <Button
          onClick={() => {
            if (!start || !end || start >= end) { toast({ type: "warning", title: t("gym.ptOps.invalidRange") }); return; }
            create.mutate();
          }}
          disabled={create.isPending}
          className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm"
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />} {t("gym.ptOps.addBlocked")}
        </Button>
      </div>
    </div>
  );
}
