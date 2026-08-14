"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, CopyIcon, Save } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { ticketService } from "@/services/ticket.service";
import { LoadingSkeleton } from "@/shared/components/common/loading-skeleton";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { ptAvailabilityKeys } from "../query-keys";
import type { PtAvailabilitySlot } from "@/types/Ticket";

const HORIZON_DAYS = 28;

/**
 * PT khai lịch rảnh theo NGÀY CỤ THỂ (câu 26) — không còn 7 dòng theo thứ.
 *
 * Quyết định #8: dưới ngưỡng ngày thì hiện banner vàng nhưng nút Lưu VẪN BẬT và
 * lưu vẫn thành công; PT vẫn xuất hiện trong tìm kiếm của khách.
 */
export function TrainerAvailabilityPage() {
  const t = useTranslations("ptAvailability");
  const { toast } = useToast();
  const client = useQueryClient();

  const [from] = useState(() => new Date().toISOString().slice(0, 10));
  const to = useMemo(() => {
    const end = new Date(`${from}T00:00:00`);
    end.setDate(end.getDate() + HORIZON_DAYS - 1);
    return end.toISOString().slice(0, 10);
  }, [from]);

  const { data: saved, isLoading } = useQuery({
    queryKey: ptAvailabilityKeys.mine(from, to),
    queryFn: () => ticketService.ptMySlots(from, to),
  });

  const [slots, setSlots] = useState<PtAvailabilitySlot[]>([]);
  const [warning, setWarning] = useState<string | null>(null);
  const [daysWithSlots, setDaysWithSlots] = useState<number | null>(null);
  const [threshold, setThreshold] = useState(20);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (saved) setSlots(saved);
  }, [saved]);

  const dates = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    return Array.from({ length: HORIZON_DAYS }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day.toISOString().slice(0, 10);
    });
  }, [from]);

  const declaredDays = new Set(slots.map((slot) => slot.date)).size;

  if (isLoading) return <LoadingSkeleton />;

  function addSlot(date: string) {
    setSlots((prev) => [...prev, { date, startTime: "18:00", endTime: "19:00" }]);
  }

  function updateSlot(index: number, patch: Partial<PtAvailabilitySlot>) {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  }

  function removeSlot(index: number) {
    setSlots((prev) => prev.filter((_, i) => i !== index));
  }

  /**
   * Tiện ích thay cho copyRowToOtherDays cũ: nhân bản khung giờ của một ngày
   * ra cùng thứ trong các tuần còn lại của khoảng đang khai. Vẫn đẻ ra NGÀY
   * THẬT chứ không phải quy tắc lặp.
   */
  function repeatWeekly(date: string) {
    const source = slots.filter((slot) => slot.date === date);
    if (source.length === 0) return;
    const start = new Date(`${date}T00:00:00`);
    const additions: PtAvailabilitySlot[] = [];
    for (let week = 1; week * 7 < HORIZON_DAYS; week += 1) {
      const target = new Date(start);
      target.setDate(start.getDate() + week * 7);
      const iso = target.toISOString().slice(0, 10);
      if (iso > to) break;
      for (const slot of source) {
        const exists = slots.some(
          (other) => other.date === iso && other.startTime === slot.startTime,
        );
        if (!exists) additions.push({ ...slot, date: iso });
      }
    }
    setSlots((prev) => [...prev, ...additions]);
  }

  async function save() {
    setSaving(true);
    try {
      const result = await ticketService.ptSaveSlots(from, to, slots);
      setWarning(result.warning ?? null);
      setDaysWithSlots(result.daysWithSlots);
      setThreshold(result.threshold);
      client.invalidateQueries({ queryKey: ptAvailabilityKeys.all });
      toast({ type: "success", title: t("saved", { count: result.saved }) });
    } catch (error) {
      toast({ type: "error", title: toErrorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("range", { from, to })}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">
            {t("counter", { days: daysWithSlots ?? declaredDays, threshold })}
          </span>
          {/* Quyết định #8: nút Lưu KHÔNG bị vô hiệu khi dưới ngưỡng. */}
          <Button disabled={saving} onClick={save}>
            <Save className="mr-2 size-4" />
            {t("save")}
          </Button>
        </div>
      </div>

      {warning ? (
        <div className="flex gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p>{warning}</p>
            <p className="mt-1">{t("warningStillSaved")}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dates.map((date) => {
          const daySlots = slots
            .map((slot, index) => ({ slot, index }))
            .filter(({ slot }) => slot.date === date);
          return (
            <div key={date} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{date}</p>
                <div className="flex gap-1">
                  {daySlots.length > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      title={t("repeatWeekly")}
                      onClick={() => repeatWeekly(date)}
                    >
                      <CopyIcon className="size-4" />
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => addSlot(date)}>
                    {t("addSlot")}
                  </Button>
                </div>
              </div>

              {daySlots.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("dayOff")}</p>
              ) : (
                daySlots.map(({ slot, index }) => (
                  <div key={`${date}-${index}`} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.startTime.slice(0, 5)}
                      onChange={(event) =>
                        updateSlot(index, { startTime: event.target.value })
                      }
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                      type="time"
                      value={slot.endTime.slice(0, 5)}
                      onChange={(event) => updateSlot(index, { endTime: event.target.value })}
                    />
                    <Button variant="ghost" size="sm" onClick={() => removeSlot(index)}>
                      ×
                    </Button>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
