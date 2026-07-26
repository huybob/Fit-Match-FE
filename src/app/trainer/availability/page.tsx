"use client";

// B-26/B-28 (audit 2026-07-17, UC-028/029): trang thật thay placeholder "đang phát triển".
// - Lịch rảnh hằng tuần: dayOfWeek 1-7 (1 = Thứ 2) khớp BE — schema cũ 0-6 lệch 1 ngày.
// - PUT /pt/availability thay TOÀN BỘ lịch (replace-all); BE chặn thu hẹp đè booking (409).
// - Thời gian chặn cá nhân (blocked time): tạo/xóa từng khoảng.

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/lib/toast-provider";
import {
  useCreateMyBlockedTime,
  useDeleteMyBlockedTime,
  useMyAvailability,
  useMyBlockedTimes,
  useUpdateMyAvailability,
} from "@/modules/trainer/hooks/use-trainer";
import type { AvailabilitySlot } from "@/types/Trainer";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { toErrorMessage } from "@/shared/utils/error.util";
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


type Row = AvailabilitySlot & { key: number };
let rowKey = 0;

export default function TrainerAvailabilityPage() {
  const t = useTranslations();
  const fmt = useFormatters();
  const { toast } = useToast();
  const availability = useMyAvailability();
  const updateAvailability = useUpdateMyAvailability();
  const blocked = useMyBlockedTimes();
  const createBlocked = useCreateMyBlockedTime();
  const deleteBlocked = useDeleteMyBlockedTime();

  const [rows, setRows] = useState<Row[]>([]);
  const [dirty, setDirty] = useState(false);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");
  const [blockReason, setBlockReason] = useState("");

  useEffect(() => {
    if (!availability.data) return;
    setRows(availability.data.map((s) => ({
      key: rowKey++,
      dayOfWeek: s.dayOfWeek,
      startTime: s.startTime?.slice(0, 5) ?? "",
      endTime: s.endTime?.slice(0, 5) ?? "",
    })));
    setDirty(false);
  }, [availability.data]);

  function addRow() {
    setRows((prev) => [...prev, { key: rowKey++, dayOfWeek: 1, startTime: "08:00", endTime: "12:00" }]);
    setDirty(true);
  }
  function patchRow(key: number, patch: Partial<AvailabilitySlot>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    setDirty(true);
  }
  function removeRow(key: number) {
    setRows((prev) => prev.filter((r) => r.key !== key));
    setDirty(true);
  }

  const invalid = rows.some((r) => !r.startTime || !r.endTime || r.startTime >= r.endTime);

  async function saveAvailability() {
    try {
      await updateAvailability.mutateAsync(
        rows.map(({ dayOfWeek, startTime, endTime }) => ({ dayOfWeek, startTime, endTime })),
      );
      toast({ type: "success", title: t("trainer.availability.saved") });
    } catch (e) {
      // BE chặn thu hẹp lịch đè booking HOLDING tương lai (P1-15) — hiện nguyên văn.
      toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) });
    }
  }

  async function addBlockedTime() {
    if (!blockStart || !blockEnd || blockStart >= blockEnd) {
      toast({ type: "warning", title: t("trainer.availability.invalidBlock") });
      return;
    }
    try {
      await createBlocked.mutateAsync({
        startAt: blockStart + ":00",
        endAt: blockEnd + ":00",
        reason: blockReason.trim() || undefined,
      });
      setBlockStart(""); setBlockEnd(""); setBlockReason("");
      toast({ type: "success", title: t("trainer.availability.blockAdded") });
    } catch (e) {
      toast({ type: "error", title: t("gym.ptOps.addFailed"), description: toErrorMessage(e) });
    }
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t("trainer.availability.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("trainer.availability.subtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* {t("trainer.availability.weeklyTitle")} */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
              <CalendarClock className="size-4 text-primary" /> {t("trainer.availability.weeklyTitle")}
            </h2>
            <Button onClick={addRow} className="h-8 gap-1.5 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="size-3.5" /> {t("common.actions.addTimeSlot")}
            </Button>
          </div>

          {availability.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : availability.isError ? (
            <p className="text-sm text-destructive">{toErrorMessage(availability.error)}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">{t("trainer.availability.noSlots")}</p>
          ) : (
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.key} className="flex items-center gap-2">
                  <Select
                    value={String(r.dayOfWeek)}
                    onValueChange={(v) => patchRow(r.key, { dayOfWeek: Number(v) })}
                  >
                    <SelectTrigger className="h-9 w-28 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WEEKDAY_ORDER.map((d) => (
                        <SelectItem key={d} value={String(d)}>{t(weekdayKey(d))}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <TimePicker value={r.startTime} className="h-9 w-28 text-sm"
                    onChange={(v) => patchRow(r.key, { startTime: v ?? "" })} />
                  <span className="text-xs text-muted-foreground">→</span>
                  <TimePicker value={r.endTime} className="h-9 w-28 text-sm"
                    onChange={(v) => patchRow(r.key, { endTime: v ?? "" })} />
                  <IconButton tooltip={t("gym.ptOps.deleteSlot")} onClick={() => removeRow(r.key)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
              ))}
            </div>
          )}

          {invalid && <p className="mt-2 text-xs text-destructive">{t("trainer.availability.slotsInvalid")}</p>}

          <div className="mt-4 flex justify-end">
            <Button
              onClick={saveAvailability}
              disabled={!dirty || invalid || updateAvailability.isPending}
              className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {updateAvailability.isPending && <Loader2 className="size-4 animate-spin" />} {t("trainer.availability.save")}
            </Button>
          </div>
        </section>

        {/* Thời gian chặn */}
        <section className="bg-card rounded-2xl border border-border shadow-sm p-6">
          <h2 className="text-sm font-bold text-foreground mb-4">{t("trainer.availability.blockedTitle")}</h2>

          {blocked.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
          ) : blocked.isError ? (
            <p className="text-sm text-destructive">{toErrorMessage(blocked.error)}</p>
          ) : !(blocked.data ?? []).length ? (
            <p className="text-sm text-muted-foreground py-2">{t("trainer.availability.noBlocked")}</p>
          ) : (
            <ul className="space-y-2 mb-4">
              {(blocked.data ?? []).map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2">
                  <div className="min-w-0 text-sm">
                    <p className="font-semibold text-foreground">
                      {fmt.dateTime(b.startAt)} → {fmt.dateTime(b.endAt)}
                    </p>
                    {b.reason && <p className="text-xs text-muted-foreground truncate">{b.reason}</p>}
                  </div>
                  <button
                    onClick={() => b.id != null && deleteBlocked.mutate(b.id, {
                      onError: (e) => toast({ type: "error", title: t("common.states.failed"), description: toErrorMessage(e) }),
                    })}
                    disabled={deleteBlocked.isPending}
                    className="p-1.5 text-muted-foreground hover:text-destructive shrink-0"
                    aria-label={t("gym.ptOps.deleteBlocked")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-dashed border-border p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground">{t("trainer.availability.addBlockTitle")}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">{t("admin.auditLogs.from")}</label>
                <DateTimePicker value={blockStart} onChange={(v) => setBlockStart(v ?? "")} className="text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">{t("admin.auditLogs.to")}</label>
                <DateTimePicker value={blockEnd} onChange={(v) => setBlockEnd(v ?? "")} className="text-sm" />
              </div>
            </div>
            <Input value={blockReason} maxLength={255} onChange={(e) => setBlockReason(e.target.value)} placeholder={t("gym.ptOps.reasonOptional")} className="text-sm" />
            <Button onClick={addBlockedTime} disabled={createBlocked.isPending} className="h-9 gap-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm">
              {createBlocked.isPending && <Loader2 className="size-4 animate-spin" />} {t("trainer.availability.addBlock")}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
