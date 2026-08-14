"use client";

// Dialog vận hành PT cho gym: B-16 phân công (UC-022), B-17 hiệu suất (UC-023).

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { gymService } from "@/services/gym.service";
import type { GymPtResponse } from "@/types/Gym";
import type { PtAssignmentInput } from "@/types/Trainer";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { Button } from "@/shared/components/ui/button";
import { Dialog } from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { IconButton } from "@/shared/components/ui/icon-button";
import { useTranslations } from "next-intl";

type Tab = "assignments" | "performance";

/*
 * Hai tab đã bị gỡ cùng mô hình booking:
 *  - "Lịch rảnh": lịch tuần dayOfWeek 1-7 không còn (câu 26 — PT khai theo NGÀY
 *    cụ thể), và gym không cấu hình hộ nữa; PT tự khai ở /trainer/availability.
 *  - "Chặn giờ": bảng blocked_times bị drop ở V81 — "bận" giờ đơn giản là không
 *    khai khung giờ cho ngày đó.
 * Cả hai vẫn gọi endpoint đã xoá và trả 404 cho tới khi bị gỡ ở đây.
 */
const TABS = [
  { key: "assignments", labelKey: "gym.ptOps.tabAssignments" },
  { key: "performance", labelKey: "gym.ptOps.tabPerformance" },
] as const satisfies ReadonlyArray<{ key: Tab; labelKey: string }>;

export function PtOpsDialog({ pt, onClose }: { pt: GymPtResponse; onClose: () => void }) {
  const t = useTranslations();
  const [tab, setTab] = useState<Tab>("assignments");
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
      {tab === "assignments" && <AssignmentsTab ptId={ptId} />}
      {tab === "performance" && <PerformanceTab ptId={ptId} />}
    </Dialog>
  );
}

function AssignmentsTab({ ptId }: { ptId: number }) {
  const t = useTranslations();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [targetId, setTargetId] = useState("");

  const assignments = useQuery({
    queryKey: ["gym-pt", ptId, "assignments"],
    queryFn: () => gymService.listPtAssignments(ptId),
  });
  const branches = useQuery({ queryKey: ["gym-branches"], queryFn: gymService.listOwnBranches });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["gym-pt", ptId, "assignments"] });

  const add = useMutation({
    mutationFn: () => {
      const payload: PtAssignmentInput = { branchId: Number(targetId) };
      return gymService.addPtAssignment(ptId, payload);
    },
    onSuccess: () => { invalidate(); setTargetId(""); toast({ type: "success", title: t("gym.trainers.assigned") }); },
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.assignFailed"), description: toErrorMessage(e) }),
  });

  const remove = useMutation({
    mutationFn: (assignmentId: number) => gymService.removePtAssignment(ptId, assignmentId),
    onSuccess: () => { invalidate(); toast({ type: "success", title: t("gym.ptOps.assignRemoved") }); },
    // BE chặn gỡ khi PT còn buổi tập tương lai (P1-16) — hiện nguyên văn lý do.
    onError: (e) => toast({ type: "error", title: t("gym.ptOps.removeFailed"), description: toErrorMessage(e) }),
  });

  // /gym/branches trả về cả chi nhánh đã ngừng (màn quản lý cần thấy để bật
  // lại), nhưng gán PT vào đó thì vô nghĩa — chi nhánh ngừng không bán vé.
  const options = (branches.data ?? [])
    .filter((b) => b.active !== false)
    .map((b) => ({ id: b.id, name: b.name }));

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
                {t("gym.ptOps.branchPrefix", { name: a.branchName ?? "" })}
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
