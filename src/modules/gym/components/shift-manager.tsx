"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { shiftService } from "@/services/shift.service";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Badge } from "@/shared/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { weekdayShortKey } from "@/shared/utils/enum-label.util";
import { shiftKeys } from "../shift-query-keys";
import type { GymShift, GymShiftInput } from "@/types/Shift";

/** 1 = T2 … 7 = CN, khớp ISO-8601 của BE. Nhãn lấy từ common.weekdayShort
 * sẵn có — không tự khai một bộ tên thứ thứ hai trong app. */
const ISO_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;

interface ShiftManagerProps {
  branchId: number;
}

/**
 * Gym khai CA làm việc cho một chi nhánh (BE V85).
 *
 * Mọi ràng buộc thật — ca phải nằm trong giờ mở cửa, không chồng ca, độ dài chia
 * hết slotMinutes, không vắt nửa đêm — do BE kiểm và trả về MỘT thông điệp gộp
 * đủ lý do. FE không nhân bản luật đó: hai bộ luật lệch nhau còn tệ hơn là
 * người dùng phải bấm Lưu một lần để biết.
 */
export function ShiftManager({ branchId }: ShiftManagerProps) {
  const t = useTranslations("gymShifts");
  const tc = useTranslations();
  const { toast } = useToast();
  const client = useQueryClient();

  const [editing, setEditing] = useState<GymShift | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<GymShiftInput>(emptyForm());

  const { data: shifts, isLoading } = useQuery({
    queryKey: shiftKeys.byBranch(branchId),
    queryFn: () => shiftService.listShifts(branchId),
    enabled: branchId > 0,
  });

  const save = useMutation({
    mutationFn: () =>
      editing
        ? shiftService.updateShift(branchId, editing.id, form)
        : shiftService.createShift(branchId, form),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: shiftKeys.all });
      toast({ type: "success", title: editing ? t("updated") : t("created") });
      setOpen(false);
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  const remove = useMutation({
    mutationFn: (shiftId: number) => shiftService.deleteShift(branchId, shiftId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: shiftKeys.all });
      toast({ type: "success", title: t("deleted") });
    },
    onError: (error) => toast({ type: "error", title: toErrorMessage(error) }),
  });

  if (isLoading) return <LoadingSkeleton />;

  function startCreate() {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  }

  function startEdit(shift: GymShift) {
    setEditing(shift);
    setForm({
      name: shift.name,
      startTime: shift.startTime.slice(0, 5),
      endTime: shift.endTime.slice(0, 5),
      slotMinutes: shift.slotMinutes,
      daysOfWeek: shift.daysOfWeek,
      active: shift.active,
    });
    setOpen(true);
  }

  function toggleDay(day: number) {
    setForm((prev) => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b),
    }));
  }

  const rows = shifts ?? [];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={startCreate}>
          <Plus className="mr-2 size-4" />
          {t("create")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : (
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("hours")}</TableHead>
                <TableHead>{t("slotMinutes")}</TableHead>
                <TableHead>{t("days")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell className="font-medium">{shift.name}</TableCell>
                  <TableCell className="tabular-nums">
                    {shift.startTime.slice(0, 5)}–{shift.endTime.slice(0, 5)}
                  </TableCell>
                  <TableCell>
                    {t("slotSummary", { minutes: shift.slotMinutes, count: shift.slotCount })}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {shift.daysOfWeek.map((d) => tc(weekdayShortKey(d))).join(", ")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={shift.active ? "success" : "default"}>
                      {shift.active ? t("active") : t("inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(shift)}>
                      {t("edit")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(shift.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <DialogRoot open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? t("editTitle") : t("createTitle")}</DialogTitle>
            <DialogDescription>{t("rulesHint")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="shift-name">{t("name")}</Label>
              <Input
                id="shift-name"
                value={form.name}
                placeholder={t("namePlaceholder")}
                onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="shift-start">{t("startTime")}</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => setForm((p) => ({ ...p, startTime: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end">{t("endTime")}</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => setForm((p) => ({ ...p, endTime: event.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-slot">{t("slotMinutes")}</Label>
                <Input
                  id="shift-slot"
                  type="number"
                  min={15}
                  max={240}
                  step={15}
                  value={form.slotMinutes}
                  onChange={(event) =>
                    setForm((p) => ({ ...p, slotMinutes: Number(event.target.value) }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>{t("days")}</Label>
              <div className="flex flex-wrap gap-2">
                {ISO_DAYS.map((day) => {
                  const selected = form.daysOfWeek.includes(day);
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("cancel")}
            </Button>
            <Button
              disabled={save.isPending || !form.name.trim() || form.daysOfWeek.length === 0}
              onClick={() => save.mutate()}
            >
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </DialogRoot>
    </section>
  );
}

function emptyForm(): GymShiftInput {
  return {
    name: "",
    startTime: "18:00",
    endTime: "22:00",
    slotMinutes: 60,
    daysOfWeek: [1, 2, 3, 4, 5],
    active: true,
  };
}
