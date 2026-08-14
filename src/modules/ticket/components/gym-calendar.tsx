"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CameraIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { gymService } from "@/services/gym.service";
import { EmptyState } from "@/shared/components/common/empty-state";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
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
import { useConfirmPtSession, useGymCalendar } from "../hooks/use-ticket";
import type { GymCalendarEntry } from "@/types/Ticket";

/**
 * Lịch quản lý của gym — READ-ONLY (quyết định #7).
 *
 * Không có accept / reject / assign-pt / reschedule / cancel / no-show. Thao
 * tác duy nhất là xác nhận buổi có PT kèm ảnh (câu 31/33).
 *
 * Mỗi lần đổi tuần là MỘT truy vấn với from/to tương ứng — không còn tải một
 * trang 200 bản ghi rồi gom ở client.
 */
export function GymCalendarPage() {
  const t = useTranslations("gymCalendar");
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [branchId, setBranchId] = useState<number>(0);
  const [detail, setDetail] = useState<GymCalendarEntry | null>(null);

  const { data: branches } = useQuery({
    queryKey: ["gym-branches"],
    queryFn: () => gymService.listOwnBranches(),
  });

  const from = toIso(weekStart);
  const to = toIso(addDays(weekStart, 6));
  const effectiveBranchId = branchId || branches?.[0]?.id || 0;

  const { data: calendar, isLoading } = useGymCalendar(effectiveBranchId, from, to);

  const weekLabel = useMemo(
    () => `${formatShort(weekStart)} – ${formatShort(addDays(weekStart, 6))}`,
    [weekStart],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Select
            value={String(effectiveBranchId)}
            onValueChange={(value) => setBranchId(Number(value))}
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder={t("pickBranch")} />
            </SelectTrigger>
            <SelectContent>
              {(branches ?? []).map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("prevWeek")}
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="min-w-40 text-center text-sm">{weekLabel}</span>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("nextWeek")}
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {!effectiveBranchId ? (
        <EmptyState title={t("noBranch")} description={t("pickBranch")} />
      ) : isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid gap-3 md:grid-cols-7">
          {(calendar ?? []).map((day) => (
            <div key={day.date} className="min-h-32 rounded-md border p-2">
              <p className="mb-2 text-sm font-medium">{formatShort(new Date(`${day.date}T00:00:00`))}</p>
              <div className="space-y-2">
                {day.sessions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("emptyDay")}</p>
                ) : (
                  day.sessions.map((entry) => (
                    <button
                      key={entry.sessionId}
                      type="button"
                      onClick={() => setDetail(entry)}
                      className="w-full rounded border p-2 text-left text-xs hover:bg-muted"
                    >
                      <span className="block font-medium">{entry.customerName}</span>
                      <span className="block text-muted-foreground">
                        {entry.ticketKind === "PACKAGE"
                          ? t("dayOf", { index: entry.dayIndex, total: entry.dayCount })
                          : entry.ticketName}
                      </span>
                      {entry.ptName ? (
                        <span className="block text-muted-foreground">
                          {entry.ptName} · {entry.slotStart?.slice(0, 5)}
                        </span>
                      ) : null}
                      {entry.ptConfirmed ? (
                        <Badge variant="outline" className="mt-1">
                          {t("confirmed")}
                        </Badge>
                      ) : null}
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionDetailDialog entry={detail} onClose={() => setDetail(null)} />
    </div>
  );
}

/** Dialog chỉ đọc; hành động duy nhất là xác nhận PT có mặt kèm ảnh. */
function SessionDetailDialog({
  entry,
  onClose,
}: {
  entry: GymCalendarEntry | null;
  onClose: () => void;
}) {
  const t = useTranslations("gymCalendar");
  const { toast } = useToast();
  const confirm = useConfirmPtSession();
  const [evidenceUrl, setEvidenceUrl] = useState("");

  if (!entry) return null;

  async function submit() {
    if (!entry) return;
    try {
      await confirm.mutateAsync({ sessionId: entry.sessionId, evidenceUrl });
      toast({ type: "success", title: t("confirmSuccess") });
      setEvidenceUrl("");
      onClose();
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    }
  }

  return (
    <Dialog open onClose={onClose} title={t("detailTitle")}>
      <div className="space-y-3 text-sm">
        <p>
          <span className="text-muted-foreground">{t("customer")}: </span>
          {entry.customerName}
        </p>
        <p>
          <span className="text-muted-foreground">{t("ticket")}: </span>
          {entry.ticketName}
          {entry.ticketKind === "PACKAGE"
            ? ` (${t("dayOf", { index: entry.dayIndex, total: entry.dayCount })})`
            : ""}
        </p>
        {entry.ptName ? (
          <p>
            <span className="text-muted-foreground">{t("pt")}: </span>
            {entry.ptName} · {entry.slotStart?.slice(0, 5)}–{entry.slotEnd?.slice(0, 5)}
          </p>
        ) : (
          <p className="text-muted-foreground">{t("noPt")}</p>
        )}

        {entry.ptName && !entry.ptConfirmed ? (
          <div className="space-y-2 border-t pt-3">
            <label className="text-sm font-medium">{t("evidenceUrl")}</label>
            <Input
              value={evidenceUrl}
              onChange={(event) => setEvidenceUrl(event.target.value)}
              placeholder={t("evidencePlaceholder")}
            />
            <Button disabled={!evidenceUrl || confirm.isPending} onClick={submit}>
              <CameraIcon className="mr-2 size-4" />
              {t("confirmPt")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("confirmHint")}</p>
          </div>
        ) : null}
      </div>
    </Dialog>
  );
}

function startOfWeek(date: Date) {
  const copy = new Date(date);
  // weekStartsOn: 1 (thứ Hai) — giữ nguyên quy ước của lịch cũ.
  const day = (copy.getDay() + 6) % 7;
  copy.setDate(copy.getDate() - day);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, amount: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatShort(date: Date) {
  return date.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit" });
}
