"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { gymService } from "@/services/gym.service";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  DialogRoot,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { todayIso } from "@/modules/ticket/calendar-date.util";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { shiftKeys } from "../shift-query-keys";
import type { PtShiftAssignResult } from "@/types/Shift";

/** 1 = T2 … 7 = CN, khớp ISO-8601 của BE. Nhãn lấy từ common.weekdayShort
 * sẵn có — không tự khai một bộ tên thứ thứ hai trong app. */
const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

interface AssignShiftDialogProps {
  branchId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Xếp PT vào ca. Một form phục vụ cả hai kiểu: để from ≠ to + chọn thứ là xếp
 * LẶP, để from = to là xếp LẺ một ngày.
 *
 * Sau khi xếp, hộp thoại KHÔNG đóng ngay mà hiện phần bị bỏ qua (ngày đóng cửa,
 * ngày PT đã có ca chồng giờ). Đóng ngay sẽ khiến Gym tưởng đã xếp đủ cả tháng.
 */
export function AssignShiftDialog({ branchId, open, onOpenChange }: AssignShiftDialogProps) {
  const t = useTranslations("gymRoster");
  const tc = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();

  // todayIso() theo lịch địa phương — toISOString() sẽ trả ngày hôm trước
  // trong khoảng 00:00-07:00 giờ VN và chặn nhầm ngày hợp lệ.
  const today = useMemo(() => todayIso(), []);
  const [ptId, setPtId] = useState<string>("");
  const [shiftId, setShiftId] = useState<string>("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [result, setResult] = useState<PtShiftAssignResult | null>(null);

  const { data: pts } = useQuery({
    queryKey: ["gym-pts", "for-roster"],
    queryFn: () => gymService.listPts({ page: 0, size: 100 }),
    enabled: open,
  });

  const { data: shifts } = useQuery({
    queryKey: shiftKeys.byBranch(branchId),
    queryFn: () => shiftService.listShifts(branchId),
    enabled: open && branchId > 0,
  });

  const assign = useMutation({
    mutationFn: () =>
      shiftService.assignShift(Number(ptId), {
        shiftId: Number(shiftId),
        from,
        to,
        daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined,
      }),
    onSuccess: (data) => {
      setResult(data);
      client.invalidateQueries({ queryKey: shiftKeys.all });
      toast({ type: "success", title: t("assigned", { count: data.created }) });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b),
    );
  }

  function close() {
    setResult(null);
    onOpenChange(false);
  }

  const activeShifts = (shifts ?? []).filter((shift) => shift.active);

  return (
    <DialogRoot open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("assignTitle")}</DialogTitle>
          <DialogDescription>{t("assignHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t("trainer")}</Label>
            <Select value={ptId} onValueChange={setPtId}>
              <SelectTrigger>
                <SelectValue placeholder={t("pickTrainer")} />
              </SelectTrigger>
              <SelectContent>
                {(pts?.content ?? []).map((pt) => (
                  <SelectItem key={pt.id} value={String(pt.id)}>
                    {pt.displayName ?? pt.username ?? `#${pt.id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>{t("shift")}</Label>
            <Select value={shiftId} onValueChange={setShiftId}>
              <SelectTrigger>
                <SelectValue placeholder={t("pickShift")} />
              </SelectTrigger>
              <SelectContent>
                {activeShifts.map((shift) => (
                  <SelectItem key={shift.id} value={String(shift.id)}>
                    {shift.name} ({shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="roster-from">{t("fromDate")}</Label>
              <Input
                id="roster-from"
                type="date"
                min={today}
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="roster-to">{t("toDate")}</Label>
              <Input
                id="roster-to"
                type="date"
                min={from}
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("repeatDays")}</Label>
            <p className="text-xs text-muted-foreground">{t("repeatDaysHint")}</p>
            <div className="flex flex-wrap gap-2">
              {ISO_DAYS.map((day) => {
                const selected = daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(day)}
                    className={
                      selected
                        ? "rounded-md border border-primary bg-primary/10 px-3 py-1.5 text-sm font-medium"
                        : "rounded-md border px-3 py-1.5 text-sm hover:border-primary"
                    }
                  >
                    {tc(weekdayShortKey(day))}
                  </button>
                );
              })}
            </div>
          </div>

          {result ? (
            <div className="space-y-1 rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{t("assignResult", { count: result.created })}</p>
              {result.alreadyAssigned.length > 0 ? (
                <p className="text-muted-foreground">
                  {t("skippedExisting", { count: result.alreadyAssigned.length })}
                </p>
              ) : null}
              {result.skippedClosed.length > 0 ? (
                <p className="text-warning">
                  {t("skippedClosed", { dates: result.skippedClosed.join(", ") })}
                </p>
              ) : null}
              {result.skippedOverlap.length > 0 ? (
                <p className="text-warning">
                  {t("skippedOverlap", { detail: result.skippedOverlap.join("; ") })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t("close")}
          </Button>
          <Button
            disabled={assign.isPending || !ptId || !shiftId || to < from}
            onClick={() => assign.mutate()}
          >
            {t("assign")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogRoot>
  );
}
